// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Groq provider — port of CodexBarCore/Providers/Groq. Groq exposes NO balance or
// quota; its only usage signal is an enterprise Prometheus metrics API reporting
// current throughput RATES. We faithfully report those (requests/min, tokens/min)
// as an honest throughput snapshot — not a cumulative total (Groq gives no total).
// Four parallel PromQL queries against {base}/metrics/prometheus/api/v1/query.

import type {
  ProviderDescriptor,
  ProviderFetchContext,
  ProviderFetchResult,
  ProviderFetchStrategy,
} from '../provider.js'
import { forMode } from '../provider.js'
import type { UsageSnapshot } from '../types.js'
import { bearer, resolveApiKey } from './api-token.js'

const ENV_KEYS = ['GROQ_API_KEY']
const ENV_URL = 'GROQ_API_URL'
const DEFAULT_BASE = 'https://api.groq.com/v1'

const QUERIES = {
  requests: 'sum(model_project_id_status_code:requests:rate5m)',
  tokensIn: 'sum(model_project_id:tokens_in:rate5m)',
  tokensOut: 'sum(model_project_id:tokens_out:rate5m)',
} as const

interface PrometheusResponse {
  status?: string
  data?: { result?: Array<{ value?: [number, string | number] }> }
}

/** Sum the scalar value across every returned Prometheus series (per-second rate). */
const sumRate = (body: PrometheusResponse): number => {
  if (body.status !== 'success') return 0
  let total = 0
  for (const series of body.data?.result ?? []) {
    const raw = series.value?.[1]
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isFinite(n)) total += n
  }
  return total
}

const groqStrategy: ProviderFetchStrategy = {
  id: 'groq.apiToken',
  kind: 'apiToken',
  async isAvailable(ctx) {
    return Boolean(resolveApiKey(ctx, ENV_KEYS))
  },
  async fetch(ctx: ProviderFetchContext): Promise<ProviderFetchResult> {
    const key = resolveApiKey(ctx, ENV_KEYS)
    if (!key) throw new Error('groq: no API key')
    const base = ctx.settings?.baseUrl ?? ctx.host.env(ENV_URL) ?? DEFAULT_BASE
    const query = async (promql: string): Promise<PrometheusResponse> => {
      const res = await ctx.host.http({
        url: `${base}/metrics/prometheus/api/v1/query?query=${encodeURIComponent(promql)}`,
        headers: bearer(key),
        timeoutMs: 30_000,
      })
      if (res.status !== 200) throw new Error(`groq metrics HTTP ${res.status}`)
      return JSON.parse(res.text) as PrometheusResponse
    }
    const [requests, tokensIn, tokensOut] = await Promise.all([
      query(QUERIES.requests),
      query(QUERIES.tokensIn),
      query(QUERIES.tokensOut),
    ])
    // Per-second rates → per-minute throughput (Groq exposes no cumulative total).
    const requestsPerMin = Math.round(sumRate(requests) * 60)
    const tokensPerMin = Math.round((sumRate(tokensIn) + sumRate(tokensOut)) * 60)
    const now = ctx.host.now().toISOString()
    const usage: UsageSnapshot = {
      providerId: 'groq',
      identity: { providerId: 'groq', loginMethod: 'api' },
      totals: { tokens: tokensPerMin, requests: requestsPerMin },
      dataConfidence: 'estimated',
      updatedAt: now,
    }
    return { usage, sourceLabel: 'Groq metrics', strategyId: this.id, strategyKind: this.kind }
  },
  shouldFallback() {
    return false
  },
}

export const groqProvider: ProviderDescriptor = {
  id: 'groq',
  metadata: {
    displayName: 'Groq',
    sessionLabel: 'Throughput (req/min)',
    weeklyLabel: 'Tokens/min',
    dashboardUrl: 'https://console.groq.com/metrics',
    color: '#f55036',
  },
  strategies: (mode) => forMode([groqStrategy], mode),
}
