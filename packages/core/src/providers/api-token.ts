// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Generic apiToken provider factory — TypeScript port of CodexBarCore's
// APITokenFetchStrategy. A provider whose usage/credits/balance is exposed
// behind a single pasteable API key becomes ~30 lines: describe how to build
// the request from settings, and how to map the JSON body into a snapshot.
//
// The factory owns everything mechanical — key resolution (settings.apiKey or
// env fallback), the HTTP call, status checking, JSON parsing, and stamping
// providerId/updatedAt — so each provider file only expresses what is unique
// to it: its endpoint, its auth header, and its response shape.

import type {
  ProviderDescriptor,
  ProviderFetchContext,
  ProviderFetchResult,
  ProviderFetchStrategy,
  ProviderMetadata,
  ProviderSettings,
} from '../provider.js'
import { forMode } from '../provider.js'
import type { CreditsSnapshot, UsageSnapshot } from '../types.js'
import type { HttpRequest } from '../host.js'

/** Everything a provider's `map` yields except the mechanical providerId/updatedAt. */
export type ApiTokenUsage = Omit<UsageSnapshot, 'providerId' | 'updatedAt'>

export interface ApiTokenResult {
  usage: ApiTokenUsage
  credits?: Omit<CreditsSnapshot, 'updatedAt'>
}

export interface ApiTokenProviderConfig {
  id: string
  metadata: ProviderMetadata
  /** Source label surfaced to the UI (defaults to the display name). */
  sourceLabel?: string
  /** Env var names to fall back to when settings.apiKey is absent. */
  envKeys?: string[]
  /** Env var names that supply a base URL for self-hosted gateways. */
  baseUrlEnv?: string[]
  /** Require a resolvable base URL (self-hosted gateways) to be available. */
  requireBaseUrl?: boolean
  /** Build the HTTP request. `settings.apiKey` (and resolved `baseUrl`) are present. */
  request: (settings: ProviderSettings, ctx: ProviderFetchContext) => HttpRequest
  /** Map a decoded 200 body into a usage/credits result. */
  map: (json: unknown, now: Date, settings: ProviderSettings) => ApiTokenResult
}

/** Resolve a base URL from explicit settings, then from host env fallbacks. */
export const resolveBaseUrl = (
  ctx: ProviderFetchContext,
  envKeys: readonly string[] = [],
): string | undefined => {
  const fromSettings = ctx.settings?.baseUrl
  if (typeof fromSettings === 'string' && fromSettings.length > 0) return fromSettings
  for (const name of envKeys) {
    const value = ctx.host.env(name)
    if (value) return value
  }
  return undefined
}

/** Resolve an API key from explicit settings, then from host env fallbacks. */
export const resolveApiKey = (
  ctx: ProviderFetchContext,
  envKeys: readonly string[] = [],
): string | undefined => {
  const fromSettings = ctx.settings?.apiKey
  if (typeof fromSettings === 'string' && fromSettings.length > 0) return fromSettings
  for (const name of envKeys) {
    const value = ctx.host.env(name)
    if (value) return value
  }
  return undefined
}

export const makeApiTokenStrategy = (config: ApiTokenProviderConfig): ProviderFetchStrategy => {
  const label = config.sourceLabel ?? config.metadata.displayName
  return {
    id: `${config.id}.apiToken`,
    kind: 'apiToken',
    async isAvailable(ctx) {
      if (!resolveApiKey(ctx, config.envKeys)) return false
      if (config.requireBaseUrl && !resolveBaseUrl(ctx, config.baseUrlEnv)) return false
      return true
    },
    async fetch(ctx): Promise<ProviderFetchResult> {
      const apiKey = resolveApiKey(ctx, config.envKeys)
      if (!apiKey) throw new Error(`${config.id}: no API key`)
      const baseUrl = resolveBaseUrl(ctx, config.baseUrlEnv)
      if (config.requireBaseUrl && !baseUrl) throw new Error(`${config.id}: no base URL`)
      const settings: ProviderSettings = { ...ctx.settings, apiKey, ...(baseUrl ? { baseUrl } : {}) }
      const req = config.request(settings, ctx)
      const res = await ctx.host.http({ method: 'GET', timeoutMs: 30_000, ...req })
      if (res.status !== 200) throw new Error(`${config.id} HTTP ${res.status}`)
      let body: unknown
      try {
        body = JSON.parse(res.text)
      } catch {
        throw new Error(`${config.id}: invalid JSON body`)
      }
      const now = ctx.host.now()
      const iso = now.toISOString()
      const { usage, credits } = config.map(body, now, settings)
      return {
        usage: { ...usage, providerId: config.id, updatedAt: iso },
        credits: credits ? { ...credits, updatedAt: iso } : undefined,
        sourceLabel: label,
        strategyId: `${config.id}.apiToken`,
        strategyKind: 'apiToken',
      }
    },
    // API-key providers have exactly one source; nothing to fall back to.
    shouldFallback() {
      return false
    },
  }
}

/** Build a single-strategy apiToken ProviderDescriptor. */
export const makeApiTokenProvider = (config: ApiTokenProviderConfig): ProviderDescriptor => {
  const strategy = makeApiTokenStrategy(config)
  return {
    id: config.id,
    metadata: config.metadata,
    strategies: (mode) => forMode([strategy], mode),
  }
}

/** Numeric coercion shared by mappers; non-finite/absent → undefined. */
export const numberOrUndefined = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined

/** Bearer auth header helper. */
export const bearer = (key: string): Record<string, string> => ({
  Authorization: `Bearer ${key}`,
  Accept: 'application/json',
})
