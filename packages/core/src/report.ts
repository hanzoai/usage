// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// Reporter — the collector's registry face. Alongside metering (the UsageStore
// reading each provider's OWN login to compute usage), it REGISTERS each signed-in
// provider account into the Hanzo Cloud login-manager registry (POST /v1/links):
// the device (machine + host + os), the account (provider + account label + plan +
// kind), and the latest usage snapshot. This is how "signing into Claude Code on
// machine X" surfaces the account + its usage in console.hanzo.ai across machines.
//
// It reuses the SAME IAM bearer the store already carries for the hanzo provider's
// /v1/billing/usage read — never a provider secret. NO OAuth token / API key is
// ever sent: only the LINK METADATA (which account is signed in, on which machine)
// and the usage snapshot the engine already computed. The account's own credential
// stays device-local, exactly as @hanzo/usage keeps it.
//
// This is purely ADDITIVE: it observes the store and reports; it changes no
// provider, no fetch pipeline, and no history.

import type { UsageHost } from './host.js'
import type { ProviderState, UsageStore } from './store.js'
import type { UsageSnapshot } from './types.js'

/** How an account is credentialed — the value that decides how its usage bills:
 *  a subscription login bills the user's plan (metered for visibility only, NO
 *  commerce charge); an api key / the hanzo cloud lane bills via commerce. */
export type LinkKind = 'subscription' | 'apikey'

/** The usage projection posted per account — the registry's Usage shape. */
export interface LinkUsage {
  sessionPct: number
  weeklyPct: number
  resetsAt?: string
  tokens: number
  inputTokens?: number
  outputTokens?: number
  spendCents: number
  currency?: string
  confidence?: string
  updatedAt?: string
}

/** One account-link upsert body (POST /v1/links). Carries NO secret. */
export interface LinkPayload {
  machine: string
  host?: string
  os?: string
  provider: string
  account?: string
  plan?: string
  kind: LinkKind
  usage?: LinkUsage
}

export interface ReporterConfig {
  host: UsageHost
  /** Origin of the cloud API, e.g. `https://api.hanzo.ai`. Trailing slash ok. */
  baseUrl: string
  /** IAM bearer resolver — the SAME token the store uses for the hanzo provider. */
  getToken: () => Promise<string | undefined> | string | undefined
  /** Stable machine id (the device key) — the caller (CLI/desktop) supplies it. */
  machine: string
  /** Device labels for the cockpit. */
  hostname?: string
  os?: string
}

export interface ReportOutcome {
  reported: number
  skipped: number
  errors: Array<{ provider: string; error: string }>
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/** The subscription-login providers whose default lane is the user's own plan. */
const SUBSCRIPTION_PROVIDERS = new Set(['claude', 'codex'])

/**
 * accountKind decides the billing lane of a provider account: a subscription login
 * (bills the user's plan) vs an api key / the hanzo cloud lane (bills via commerce).
 * It reads how the engine authed — the snapshot's login method — then falls back to
 * the provider id. hanzo is always the commerce (api-key) lane. An unknown provider
 * defaults to api-key so its usage is never silently treated as a free subscription.
 */
export function accountKind(providerId: string, snapshot?: UsageSnapshot): LinkKind {
  if (providerId === 'hanzo') return 'apikey'
  const lm = (snapshot?.identity?.loginMethod ?? '').toLowerCase()
  if (lm.includes('api') || lm.includes('token') || lm.includes('key')) return 'apikey'
  if (lm.includes('oauth') || lm.includes('web') || lm.includes('cli') || lm.includes('subscription')) {
    return 'subscription'
  }
  return SUBSCRIPTION_PROVIDERS.has(providerId) ? 'subscription' : 'apikey'
}

/** The account label — the identity that distinguishes two subscriptions of the
 *  same provider (e.g. two Claude Max accounts by email). "" when the provider
 *  reports no distinguishable account (one anonymous account per provider/device). */
export function accountLabel(snapshot?: UsageSnapshot): string {
  return (
    snapshot?.identity?.accountEmail?.trim() ||
    snapshot?.identity?.accountOrganization?.trim() ||
    ''
  )
}

/** Project a provider's usage snapshot into the registry's usage shape. Spend is
 *  the provider's own cost meter in cents (0 for a pure subscription — the plan is
 *  flat). */
export function usageOf(snapshot: UsageSnapshot): LinkUsage {
  const cost = snapshot.providerCost
  return {
    sessionPct: num(snapshot.primary?.usedPercent),
    weeklyPct: num(snapshot.secondary?.usedPercent),
    resetsAt: snapshot.primary?.resetsAt,
    tokens: num(snapshot.totals?.tokens),
    inputTokens: snapshot.totals?.inputTokens,
    outputTokens: snapshot.totals?.outputTokens,
    spendCents: cost ? Math.round(num(cost.used) * 100) : 0,
    currency: cost?.currencyCode,
    confidence: snapshot.dataConfidence,
    updatedAt: snapshot.updatedAt,
  }
}

/** Build the link-upsert body for one provider's store state, or null when the
 *  provider has no snapshot yet (not signed in / never fetched — not an account). */
export function linkPayload(
  providerId: string,
  state: ProviderState,
  cfg: ReporterConfig,
): LinkPayload | null {
  const snapshot = state.snapshot
  if (!snapshot) return null
  return {
    machine: cfg.machine,
    host: cfg.hostname,
    os: cfg.os,
    provider: providerId,
    account: accountLabel(snapshot),
    plan: snapshot.identity?.plan,
    kind: accountKind(providerId, snapshot),
    usage: usageOf(snapshot),
  }
}

/**
 * Reporter mirrors the UsageStore's per-provider state into the login-manager
 * registry. One upsert per signed-in provider account; best-effort per provider so
 * one failure never blocks the rest.
 */
export class Reporter {
  constructor(
    private readonly store: UsageStore,
    private readonly cfg: ReporterConfig,
  ) {}

  /** Report the current store state to the registry (one upsert per signed-in
   *  account). A missing bearer is an honest no-op (the collector is not linked to
   *  a cloud account yet), never an error. */
  async report(): Promise<ReportOutcome> {
    const out: ReportOutcome = { reported: 0, skipped: 0, errors: [] }
    const providers = this.store.getState().providers
    const token = await this.cfg.getToken()
    if (!token) {
      out.skipped = Object.keys(providers).length
      return out
    }
    const base = this.cfg.baseUrl.replace(/\/+$/, '')
    for (const [id, state] of Object.entries(providers)) {
      const payload = linkPayload(id, state, this.cfg)
      if (!payload) {
        out.skipped++
        continue
      }
      try {
        const res = await this.cfg.host.http({
          url: `${base}/v1/links`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          timeoutMs: 15_000,
        })
        if (res.status >= 200 && res.status < 300) out.reported++
        else out.errors.push({ provider: id, error: `HTTP ${res.status}` })
      } catch (e) {
        out.errors.push({ provider: id, error: e instanceof Error ? e.message : String(e) })
      }
    }
    return out
  }

  /** Report on every store change (debounced) so a fresh usage snapshot flows to
   *  the registry as the engine polls. Reports the current state immediately.
   *  Returns a stop function. */
  start(debounceMs = 3000): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = (): void => {
      if (timer) return
      timer = setTimeout(() => {
        timer = undefined
        void this.report()
      }, debounceMs)
    }
    const unsub = this.store.subscribe(schedule)
    void this.report()
    return () => {
      if (timer) clearTimeout(timer)
      unsub()
    }
  }
}

export function createReporter(store: UsageStore, cfg: ReporterConfig): Reporter {
  return new Reporter(store, cfg)
}
