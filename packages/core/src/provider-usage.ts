// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// Connected-provider usage — the ONE canonical shape + read for a customer's IMPORTED
// third-party AI usage (OpenAI / Anthropic / Google), the wire-exact TypeScript mirror
// of `controllers.ProviderUsage` (hanzoai/ai controllers/connections_usage.go).
//
// The server owns the shape: `GET /v1/ai/connections/:provider/usage?from&to` unseals
// the org's KMS-sealed key SERVER-SIDE (the key never touches the browser), calls THAT
// provider's own usage/cost API, and normalizes the answer to spend (USD cents) +
// tokens + requests + per-model + a day-bucketed series. This file mirrors that value,
// the bearer read that fetches it, and a boundary-normalizer so a partial/errored
// payload degrades to an HONEST empty state (connected/available flags + a human note)
// instead of a fabricated number. NOTHING is derived client-side.

import { UsageError } from './cloud-usage.js'

/** Window totals — the metric cards. Money is USD cents end-to-end (matches CloudUsageTotals). */
export interface ProviderUsageTotals {
  spendCents: number
  tokens: number
  inputTokens: number
  outputTokens: number
  requests: number
}

/** One day-bucket of the ascending time series. */
export interface ProviderUsageSeriesPoint {
  /** RFC3339 bucket start (UTC). */
  t: string
  spendCents: number
  tokens: number
  requests: number
}

/** One model's slice of the window. `spendCents` is 0 for providers whose per-model
 *  cost isn't exposed by their usage API (honest) — tokens/requests are still real. */
export interface ProviderUsageModelSpend {
  model: string
  spendCents: number
  tokens: number
  requests: number
}

/**
 * A connected provider's imported usage. `connected` is false when the org has no
 * active connection; `available` is false (with a human `note`) when the provider API
 * returned nothing or the key lacked the usage scope — the two distinct honest-empty
 * states the UI renders instead of a fabricated zero.
 */
export interface ProviderUsage {
  provider: string
  connected: boolean
  available: boolean
  note?: string
  currency: string
  start: string
  end: string
  interval: string
  totals: ProviderUsageTotals
  series: ProviderUsageSeriesPoint[]
  byModel: ProviderUsageModelSpend[]
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const bool = (v: unknown): boolean => v === true

function normalizeTotals(t: unknown): ProviderUsageTotals {
  const o = (t ?? {}) as Record<string, unknown>
  return {
    spendCents: num(o.spendCents),
    tokens: num(o.tokens),
    inputTokens: num(o.inputTokens),
    outputTokens: num(o.outputTokens),
    requests: num(o.requests),
  }
}

function normalizeSeries(s: unknown): ProviderUsageSeriesPoint[] {
  if (!Array.isArray(s)) return []
  return s.map((p) => {
    const o = (p ?? {}) as Record<string, unknown>
    return { t: str(o.t), spendCents: num(o.spendCents), tokens: num(o.tokens), requests: num(o.requests) }
  })
}

function normalizeByModel(b: unknown): ProviderUsageModelSpend[] {
  if (!Array.isArray(b)) return []
  return b.map((m) => {
    const o = (m ?? {}) as Record<string, unknown>
    return { model: str(o.model), spendCents: num(o.spendCents), tokens: num(o.tokens), requests: num(o.requests) }
  })
}

/**
 * Coerce a raw payload into a complete `ProviderUsage` — a boundary guard so a
 * renaming/partial server response degrades to an honest empty value rather than
 * throwing in a renderer. `providerFallback` fills `provider` when the payload omits it
 * (e.g. an honest "not connected" stub).
 */
export function normalizeProviderUsage(raw: unknown, providerFallback = ''): ProviderUsage {
  const o = (raw ?? {}) as Record<string, unknown>
  const note = typeof o.note === 'string' && o.note ? o.note : undefined
  return {
    provider: str(o.provider) || providerFallback,
    connected: bool(o.connected),
    available: bool(o.available),
    note,
    currency: str(o.currency) || 'usd',
    start: str(o.start),
    end: str(o.end),
    interval: str(o.interval) || 'day',
    totals: normalizeTotals(o.totals),
    series: normalizeSeries(o.series),
    byModel: normalizeByModel(o.byModel),
  }
}

/** Options for the ONE connected-usage read (bearer mode). A surface with its own auth
 *  (a same-origin cookie proxy — e.g. the console) can instead fetch the overview with
 *  its own client and pass the value to `<ConnectedUsage>` in data mode. */
export interface FetchProviderUsageOptions {
  /** Origin of the cloud API, e.g. `https://api.hanzo.ai`. Trailing slash ok. */
  baseUrl: string
  /** IAM bearer for `Authorization`. */
  token: string
  /** provider slug — openai | anthropic | google. */
  provider: string
  /** window bounds (RFC3339, YYYY-MM-DD, or unix seconds); default last 30 days server-side. */
  from?: string
  to?: string
  signal?: AbortSignal
  /** Injected for tests / non-global fetch. */
  fetch?: typeof fetch
}

/**
 * Read a connected provider's imported usage from
 * `GET {baseUrl}/v1/ai/connections/{provider}/usage`. Unwraps the cloud
 * `{ status, msg, data }` envelope (and tolerates a bare value), throwing a typed
 * `UsageError` on a transport failure OR a `status:"error"` body — so the caller renders
 * an honest "unavailable" state, never fabricated zeros. A 200 with connected/available
 * flags is the HONEST-EMPTY path (not connected, or the key lacks the usage scope) and is
 * returned normally for the UI to render its empty state + note.
 */
export async function fetchProviderUsage(opts: FetchProviderUsageOptions): Promise<ProviderUsage> {
  const doFetch = opts.fetch ?? globalThis.fetch
  if (!doFetch) throw new UsageError('no fetch implementation available')
  const base = opts.baseUrl.replace(/\/+$/, '')
  const provider = encodeURIComponent(opts.provider)

  const q = new URLSearchParams()
  if (opts.from) q.set('from', opts.from)
  if (opts.to) q.set('to', opts.to)
  const query = q.toString()

  let res: Response
  try {
    res = await doFetch(`${base}/v1/ai/connections/${provider}/usage${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${opts.token}`, Accept: 'application/json' },
      signal: opts.signal,
    })
  } catch (e) {
    throw new UsageError(e instanceof Error ? e.message : String(e))
  }
  if (!res.ok) throw new UsageError(`connection usage HTTP ${res.status}`, res.status)

  const body = (await res.json()) as { status?: string; msg?: string; data?: unknown }
  if (body && typeof body === 'object' && 'status' in body && body.status && body.status !== 'ok') {
    throw new UsageError(body.msg || 'usage import unavailable', res.status)
  }
  const payload = body && typeof body === 'object' && 'data' in body ? body.data : body
  return normalizeProviderUsage(payload, opts.provider)
}
