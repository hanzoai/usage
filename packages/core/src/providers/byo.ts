// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// BYO — bring-your-own OpenAI-compatible endpoint {baseUrl, apiKey}. This is the
// self-hosted / BYO-GPU tracking lane: point it at any gateway that speaks the
// OpenAI API (vLLM, LiteLLM, Hanzo Engine, a self-hosted cloud). It first tries a
// LiteLLM-style /key/info for real spend/budget; failing that it falls back to a
// /v1/models liveness probe and reports identity + reachability only
// (dataConfidence 'unknown').
//
// NOTE: BYO devices registered into Hanzo Cloud are metered natively by the cloud
// ledger (run-for-pay) regardless of what this local probe can read — this lane is
// for endpoints Hanzo does not itself operate.

import type {
  ProviderDescriptor,
  ProviderFetchContext,
  ProviderFetchResult,
  ProviderFetchStrategy,
} from '../provider.js'
import { forMode } from '../provider.js'
import type { UsageSnapshot } from '../types.js'
import { bearer, resolveApiKey, resolveBaseUrl } from './api-token.js'

const ENV_KEYS = ['BYO_API_KEY']
const ENV_URL = ['BYO_BASE_URL']

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
const stripV1 = (base: string): string => base.replace(/\/v1\/?$/, '').replace(/\/$/, '')

const keyInfo = async (
  ctx: ProviderFetchContext,
  base: string,
  key: string,
  now: Date,
): Promise<UsageSnapshot | undefined> => {
  const res = await ctx.host.http({
    url: `${stripV1(base)}/key/info`,
    headers: bearer(key),
    timeoutMs: 15_000,
  })
  if (res.status !== 200) return undefined
  let info: Record<string, unknown>
  try {
    info = obj(obj(JSON.parse(res.text)).info)
  } catch {
    return undefined
  }
  if (Object.keys(info).length === 0) return undefined
  const spend = num(info.spend)
  return {
    providerId: 'byo',
    identity: {
      providerId: 'byo',
      loginMethod: 'api',
      accountEmail: typeof info.user_id === 'string' ? info.user_id : undefined,
      accountOrganization: typeof info.team_id === 'string' ? info.team_id : undefined,
      plan: typeof info.key_name === 'string' ? info.key_name : undefined,
    },
    providerCost: { used: spend, currencyCode: 'USD', period: 'key', updatedAt: now.toISOString() },
    subscriptionExpiresAt: typeof info.expires === 'string' ? info.expires : undefined,
    dataConfidence: 'exact',
    updatedAt: now.toISOString(),
  }
}

const modelsLiveness = async (
  ctx: ProviderFetchContext,
  base: string,
  key: string,
  now: Date,
): Promise<UsageSnapshot> => {
  const root = stripV1(base)
  const res = await ctx.host.http({
    url: `${root}/v1/models`,
    headers: bearer(key),
    timeoutMs: 15_000,
  })
  if (res.status !== 200) throw new Error(`byo: /v1/models HTTP ${res.status}`)
  let count: number | undefined
  try {
    const data = obj(JSON.parse(res.text)).data
    if (Array.isArray(data)) count = data.length
  } catch {
    // liveness only — a 200 is enough even if the body is not the expected shape
  }
  return {
    providerId: 'byo',
    identity: {
      providerId: 'byo',
      loginMethod: 'api',
      accountOrganization: count !== undefined ? `${count} models` : undefined,
    },
    dataConfidence: 'unknown',
    updatedAt: now.toISOString(),
  }
}

const byoStrategy: ProviderFetchStrategy = {
  id: 'byo.apiToken',
  kind: 'apiToken',
  async isAvailable(ctx) {
    return Boolean(resolveApiKey(ctx, ENV_KEYS) && resolveBaseUrl(ctx, ENV_URL))
  },
  async fetch(ctx): Promise<ProviderFetchResult> {
    const key = resolveApiKey(ctx, ENV_KEYS)
    const base = resolveBaseUrl(ctx, ENV_URL)
    if (!key || !base) throw new Error('byo: baseUrl and apiKey are required')
    const now = ctx.host.now()
    const info = await keyInfo(ctx, base, key, now)
    if (info) {
      return { usage: info, sourceLabel: 'BYO /key/info', strategyId: this.id, strategyKind: this.kind }
    }
    const usage = await modelsLiveness(ctx, base, key, now)
    return { usage, sourceLabel: 'BYO liveness', strategyId: this.id, strategyKind: this.kind }
  },
  shouldFallback() {
    return false
  },
}

export const byoProvider: ProviderDescriptor = {
  id: 'byo',
  metadata: {
    displayName: 'BYO endpoint',
    sessionLabel: 'Key spend',
    weeklyLabel: 'Liveness',
    dashboardUrl: 'https://docs.hanzo.ai/docs/gateway',
    color: '#64748b',
  },
  strategies: (mode) => forMode([byoStrategy], mode),
}
