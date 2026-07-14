// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Hanzo provider — two lanes:
//  1. hanzo.cloud  — commerce billing usage (`GET {base}/v1/billing/usage`),
//     the same source of truth console and chat bill against.
//  2. hanzo.dev    — local probe of Hanzo Dev CLI rollouts
//     ($HANZO_HOME|$CODEX_HOME|~/.hanzo|~/.codex sessions/YYYY/MM/DD/*.jsonl):
//     the last persisted token_count event carries token totals and the
//     latest rate-limit snapshot, exactly what the dev app-server replays.

import type {
  ProviderDescriptor,
  ProviderFetchContext,
  ProviderFetchResult,
  ProviderFetchStrategy,
} from '../provider.js'
import { forMode } from '../provider.js'
import type { RateWindow, UsageSnapshot } from '../types.js'
import { expandHome } from '../host.js'

// ---- cloud (commerce ledger) ----
//
// Two orthogonal reads of the Hanzo cloud lane, kept unbraided:
//   • cloudStrategy (below) — the FLAT rate-limit/spend snapshot (`UsageSnapshot`)
//     the multi-provider store/menubar renders, from `GET /v1/billing/usage`.
//   • fetchCloudUsage (`../cloud-usage.js`) — the RICH server-shaped dashboard
//     overview (`CloudUsageOverview`) `<UsagePanel>` renders, from the canonical
//     `GET /v1/get-cloud-usages`. Different value, different read — not folded into
//     the provider pipeline's `ProviderFetchResult`.

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

const cloudStrategy: ProviderFetchStrategy = {
  id: 'hanzo.cloud',
  kind: 'apiToken',
  async isAvailable(ctx) {
    return Boolean(ctx.settings?.getToken || ctx.settings?.apiKey)
  },
  async fetch(ctx): Promise<ProviderFetchResult> {
    const base = ctx.settings?.baseUrl ?? 'https://api.hanzo.ai'
    const token = (await ctx.settings?.getToken?.()) ?? ctx.settings?.apiKey
    if (!token) throw new Error('hanzo: no token for cloud usage')
    const res = await ctx.host.http({
      url: `${base}/v1/billing/usage`,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      timeoutMs: 30_000,
    })
    if (res.status !== 200) throw new Error(`hanzo billing usage HTTP ${res.status}`)
    const body = JSON.parse(res.text) as Record<string, unknown>
    // Defensive roll-up: accept either precomputed totals or a ledger of entries.
    const entries = Array.isArray(body.usage)
      ? (body.usage as Array<Record<string, unknown>>)
      : Array.isArray(body.data)
        ? (body.data as Array<Record<string, unknown>>)
        : []
    let tokens = num(body.total_tokens ?? body.totalTokens)
    let spendCents = num(body.spend_cents ?? body.spendCents)
    let requests = num(body.total_requests ?? body.requests)
    for (const e of entries) {
      tokens += num(e.total_tokens ?? e.totalTokens ?? e.tokens)
      spendCents += num(e.spend_cents ?? e.spendCents ?? e.cost_cents)
      requests += num(e.requests ?? e.request_count ?? 1) - (e.requests === undefined && e.request_count === undefined ? 1 : 0)
    }
    const now = ctx.host.now().toISOString()
    const usage: UsageSnapshot = {
      providerId: 'hanzo',
      identity: { providerId: 'hanzo', loginMethod: 'iam' },
      providerCost: {
        used: spendCents / 100,
        currencyCode: 'USD',
        period: 'monthly',
        updatedAt: now,
      },
      totals: { tokens, requests },
      dataConfidence: 'exact',
      updatedAt: now,
    }
    return {
      usage,
      sourceLabel: 'Hanzo Cloud',
      strategyId: this.id,
      strategyKind: this.kind,
    }
  },
}

// ---- local dev CLI probe ----

interface TokenCountRateLimitWindow {
  used_percent?: number
  window_minutes?: number
  resets_in_seconds?: number
}

interface TokenCountPayload {
  type?: string
  info?: {
    total_token_usage?: {
      input_tokens?: number
      cached_input_tokens?: number
      output_tokens?: number
      total_tokens?: number
    }
  }
  rate_limits?: {
    primary?: TokenCountRateLimitWindow
    secondary?: TokenCountRateLimitWindow
  }
}

const devHome = async (ctx: ProviderFetchContext): Promise<string | undefined> => {
  const candidates = [
    ctx.host.env('HANZO_HOME'),
    ctx.host.env('CODEX_HOME'),
    expandHome(ctx.host, '~/.hanzo'),
    expandHome(ctx.host, '~/.codex'),
  ].filter((c): c is string => Boolean(c))
  for (const dir of candidates) {
    if ((await ctx.host.listDir(`${dir}/sessions`)).length > 0) return dir
  }
  return undefined
}

/** Newest entry of a directory listing of numeric names (years, months, days). */
const newest = (names: string[]): string | undefined =>
  names.filter((n) => /^\d+$/.test(n)).sort().at(-1)

const toRateWindow = (
  w: TokenCountRateLimitWindow | undefined,
  now: Date,
): RateWindow | undefined => {
  if (!w || typeof w.used_percent !== 'number') return undefined
  return {
    usedPercent: w.used_percent,
    windowMinutes: w.window_minutes,
    resetsAt:
      typeof w.resets_in_seconds === 'number'
        ? new Date(now.getTime() + w.resets_in_seconds * 1000).toISOString()
        : undefined,
  }
}

const devStrategy: ProviderFetchStrategy = {
  id: 'hanzo.dev',
  kind: 'localProbe',
  async isAvailable(ctx) {
    return Boolean(await devHome(ctx))
  },
  async fetch(ctx): Promise<ProviderFetchResult> {
    const home = await devHome(ctx)
    if (!home) throw new Error('hanzo: no dev CLI home with sessions')
    const sessions = `${home}/sessions`
    const year = newest(await ctx.host.listDir(sessions))
    const month = year && newest(await ctx.host.listDir(`${sessions}/${year}`))
    const day = month && newest(await ctx.host.listDir(`${sessions}/${year}/${month}`))
    if (!day) throw new Error('hanzo: no dev sessions found')
    const dayDir = `${sessions}/${year}/${month}/${day}`
    const rollouts = (await ctx.host.listDir(dayDir))
      .filter((f) => f.endsWith('.jsonl'))
      .sort()
    const latest = rollouts.at(-1)
    if (!latest) throw new Error('hanzo: no rollout files today')
    const text = (await ctx.host.readTextFile(`${dayDir}/${latest}`)) ?? ''
    let payload: TokenCountPayload | undefined
    for (const line of text.split('\n')) {
      if (!line.includes('"token_count"')) continue
      try {
        const item = JSON.parse(line) as { payload?: TokenCountPayload }
        if (item.payload?.type === 'token_count') payload = item.payload
      } catch {
        // tolerate partial trailing lines
      }
    }
    const now = ctx.host.now()
    const totals = payload?.info?.total_token_usage
    const usage: UsageSnapshot = {
      providerId: 'hanzo',
      primary: toRateWindow(payload?.rate_limits?.primary, now),
      secondary: toRateWindow(payload?.rate_limits?.secondary, now),
      identity: { providerId: 'hanzo', loginMethod: 'dev-cli' },
      totals: totals
        ? {
            tokens: totals.total_tokens ?? 0,
            inputTokens: totals.input_tokens ?? 0,
            outputTokens: totals.output_tokens ?? 0,
            cachedInputTokens: totals.cached_input_tokens ?? 0,
          }
        : undefined,
      dataConfidence: totals ? 'exact' : 'unknown',
      updatedAt: now.toISOString(),
    }
    return {
      usage,
      sourceLabel: 'Hanzo Dev CLI',
      strategyId: this.id,
      strategyKind: this.kind,
    }
  },
}

export const hanzoProvider: ProviderDescriptor = {
  id: 'hanzo',
  metadata: {
    displayName: 'Hanzo',
    sessionLabel: '5h limit',
    weeklyLabel: 'Weekly limit',
    defaultEnabled: true,
    dashboardUrl: 'https://console.hanzo.ai/billing/usage',
    color: '#ff2d55',
  },
  strategies: (mode) => forMode([cloudStrategy, devStrategy], mode),
}
