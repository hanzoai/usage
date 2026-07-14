// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// Cloud usage — the ONE canonical usage-overview value + its ONE canonical read.
//
// The server owns the shape: `GET /v1/get-cloud-usages` (hanzoai/ai
// controllers/cloud_usage.go) aggregates the `hanzo.cloud_usage` ledger into
// totals + prior-period deltas, an evenly-spaced time series, spend-by-model
// (top-N + "other"), and the recent-activity feed — scoped to the caller's org
// (a super admin may target one org or all). This file is the wire-exact
// TypeScript mirror of that `object.CloudUsageOverview`, plus the fetch that
// reads it and a boundary-normalizer so a partial/errored payload degrades to
// honest zeros instead of crashing a renderer. NOTHING is derived client-side —
// the client fetches this value and renders it.

/** Requested reporting window. Mirrors the server's `range` labels. */
export type UsageRange = '24h' | '7d' | '30d' | 'custom'

/** Recent-activity feed class. The ledger is inference-only; `all` == `inference`. */
export type UsageActivityType = 'all' | 'inference'

/** Window totals — the metric cards. Money is USD cents end-to-end. */
export interface CloudUsageTotals {
  tokens: number
  promptTokens: number
  completionTokens: number
  requests: number
  spendCents: number
  models: number
  providers: number
}

/** One card's "vs prior period" comparison. `pct` is null when the prior period
 *  had no basis (prior == 0), so the UI shows "new"/"—" not a fabricated ratio. */
export interface CloudUsageDelta {
  current: number
  prior: number
  pct: number | null
}

/** One point of the dense, gap-filled time series (ascending). */
export interface CloudUsageSeriesPoint {
  /** RFC3339 bucket start (UTC). */
  t: string
  tokens: number
  spendCents: number
  requests: number
  models: number
}

/** One model's slice of spend-by-model. `pct` is its share of total spend, 0..100. */
export interface CloudUsageModelSpend {
  model: string
  provider: string
  spendCents: number
  tokens: number
  requests: number
  pct: number
}

/** The folded tail of spend-by-model (everything past top-N). */
export interface CloudUsageModelOther {
  spendCents: number
  tokens: number
  requests: number
  pct: number
  modelCount: number
}

export interface CloudUsageByModel {
  items: CloudUsageModelSpend[]
  other: CloudUsageModelOther | null
  totalCents: number
}

/** One row of the recent-activity feed (every billed row is a completed inference). */
export interface CloudUsageActivityRow {
  /** RFC3339 (UTC). */
  time: string
  model: string
  provider: string
  type: string
  status: string
  tokens: number
  promptTokens: number
  completionTokens: number
  costCents: number
  stream: boolean
  premium: boolean
  requestId: string
  org: string
  user: string
}

export interface CloudUsageActivity {
  items: CloudUsageActivityRow[]
  limit: number
  offset: number
  total: number
  type: string
}

/** Whose data this overview covers — `org` empty when the all-orgs god-view. */
export interface CloudUsageScope {
  org: string
  allOrgs: boolean
}

/** The full overview the server assembles — the ONE shape `<UsagePanel>` renders. */
export interface CloudUsageOverview {
  range: string
  start: string
  end: string
  interval: string
  scope: CloudUsageScope
  totals: CloudUsageTotals
  /** Keyed by metric: tokens, spendCents, requests, models. */
  deltas: Record<string, CloudUsageDelta>
  series: CloudUsageSeriesPoint[]
  byModel: CloudUsageByModel
  activity: CloudUsageActivity
}

/** A typed failure from the usage read — carries the HTTP status when there was one. */
export class UsageError extends Error {
  readonly status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'UsageError'
    this.status = status
  }
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const bool = (v: unknown): boolean => v === true

/** Percent for a delta: a finite number, or null (no basis) — never fabricated. */
const pct = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

function normalizeTotals(t: unknown): CloudUsageTotals {
  const o = (t ?? {}) as Record<string, unknown>
  return {
    tokens: num(o.tokens),
    promptTokens: num(o.promptTokens),
    completionTokens: num(o.completionTokens),
    requests: num(o.requests),
    spendCents: num(o.spendCents),
    models: num(o.models),
    providers: num(o.providers),
  }
}

function normalizeDeltas(d: unknown): Record<string, CloudUsageDelta> {
  const out: Record<string, CloudUsageDelta> = {}
  if (d && typeof d === 'object') {
    for (const [k, v] of Object.entries(d as Record<string, unknown>)) {
      const o = (v ?? {}) as Record<string, unknown>
      out[k] = { current: num(o.current), prior: num(o.prior), pct: pct(o.pct) }
    }
  }
  return out
}

function normalizeSeries(s: unknown): CloudUsageSeriesPoint[] {
  if (!Array.isArray(s)) return []
  return s.map((p) => {
    const o = (p ?? {}) as Record<string, unknown>
    return { t: str(o.t), tokens: num(o.tokens), spendCents: num(o.spendCents), requests: num(o.requests), models: num(o.models) }
  })
}

function normalizeByModel(b: unknown): CloudUsageByModel {
  const o = (b ?? {}) as Record<string, unknown>
  const items = Array.isArray(o.items)
    ? o.items.map((m): CloudUsageModelSpend => {
        const r = (m ?? {}) as Record<string, unknown>
        return { model: str(r.model), provider: str(r.provider), spendCents: num(r.spendCents), tokens: num(r.tokens), requests: num(r.requests), pct: num(r.pct) }
      })
    : []
  let other: CloudUsageModelOther | null = null
  if (o.other && typeof o.other === 'object') {
    const r = o.other as Record<string, unknown>
    other = { spendCents: num(r.spendCents), tokens: num(r.tokens), requests: num(r.requests), pct: num(r.pct), modelCount: num(r.modelCount) }
  }
  return { items, other, totalCents: num(o.totalCents) }
}

function normalizeActivity(a: unknown): CloudUsageActivity {
  const o = (a ?? {}) as Record<string, unknown>
  const items = Array.isArray(o.items)
    ? o.items.map((r): CloudUsageActivityRow => {
        const x = (r ?? {}) as Record<string, unknown>
        return {
          time: str(x.time),
          model: str(x.model),
          provider: str(x.provider),
          type: str(x.type),
          status: str(x.status),
          tokens: num(x.tokens),
          promptTokens: num(x.promptTokens),
          completionTokens: num(x.completionTokens),
          costCents: num(x.costCents),
          stream: bool(x.stream),
          premium: bool(x.premium),
          requestId: str(x.requestId),
          org: str(x.org),
          user: str(x.user),
        }
      })
    : []
  return { items, limit: num(o.limit), offset: num(o.offset), total: num(o.total), type: str(o.type) }
}

/**
 * Coerce a raw payload into a complete `CloudUsageOverview` — a boundary guard so
 * a renaming/partial server response degrades a value to honest zeros rather than
 * throwing inside a renderer. Present, finite fields pass through untouched.
 */
export function normalizeCloudUsage(raw: unknown): CloudUsageOverview {
  const o = (raw ?? {}) as Record<string, unknown>
  const scope = (o.scope ?? {}) as Record<string, unknown>
  return {
    range: str(o.range),
    start: str(o.start),
    end: str(o.end),
    interval: str(o.interval) || 'day',
    scope: { org: str(scope.org), allOrgs: bool(scope.allOrgs) },
    totals: normalizeTotals(o.totals),
    deltas: normalizeDeltas(o.deltas),
    series: normalizeSeries(o.series),
    byModel: normalizeByModel(o.byModel),
    activity: normalizeActivity(o.activity),
  }
}

/** Options for the ONE usage read. `baseUrl`+`token` is the bearer convenience
 *  mode; a surface with its own auth (a same-origin proxy, a session cookie) can
 *  instead pass its own `fetch` and fetch the overview itself. */
export interface FetchCloudUsageOptions {
  /** Origin of the cloud API, e.g. `https://api.hanzo.ai`. Trailing slash ok. */
  baseUrl: string
  /** IAM bearer for `Authorization`. */
  token: string
  range?: UsageRange
  /** custom range bounds (RFC3339 or unix seconds), only for range === 'custom'. */
  start?: string
  end?: string
  /** Super-admin only: target org slug, or `all` for every org. */
  org?: string
  /** spend-by-model top-N (server default 6). */
  topModels?: number
  activityType?: UsageActivityType
  activityLimit?: number
  activityOffset?: number
  signal?: AbortSignal
  /** Injected for tests / non-global fetch. */
  fetch?: typeof fetch
}

/**
 * Read the canonical overview from `GET {baseUrl}/v1/get-cloud-usages`. Unwraps the
 * cloud `{ status, msg, data }` envelope (and tolerates a bare overview), throwing a
 * typed `UsageError` on a transport failure OR a `status:"error"` body (e.g. the
 * ledger's datastore peer being down) — so the caller renders an honest "unavailable"
 * state, never fabricated zeros.
 */
export async function fetchCloudUsage(opts: FetchCloudUsageOptions): Promise<CloudUsageOverview> {
  const doFetch = opts.fetch ?? globalThis.fetch
  if (!doFetch) throw new UsageError('no fetch implementation available')
  const base = opts.baseUrl.replace(/\/+$/, '')

  const q = new URLSearchParams()
  if (opts.range) q.set('range', opts.range)
  if (opts.start) q.set('start', opts.start)
  if (opts.end) q.set('end', opts.end)
  if (opts.org) q.set('org', opts.org)
  if (opts.topModels != null) q.set('topModels', String(opts.topModels))
  if (opts.activityType) q.set('activityType', opts.activityType)
  if (opts.activityLimit != null) q.set('activityLimit', String(opts.activityLimit))
  if (opts.activityOffset != null) q.set('activityOffset', String(opts.activityOffset))
  const query = q.toString()

  let res: Response
  try {
    res = await doFetch(`${base}/v1/get-cloud-usages${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${opts.token}`, Accept: 'application/json' },
      signal: opts.signal,
    })
  } catch (e) {
    throw new UsageError(e instanceof Error ? e.message : String(e))
  }
  if (!res.ok) throw new UsageError(`get-cloud-usages HTTP ${res.status}`, res.status)

  const body = (await res.json()) as { status?: string; msg?: string; data?: unknown }
  if (body && typeof body === 'object' && 'status' in body && body.status && body.status !== 'ok') {
    throw new UsageError(body.msg || 'usage ledger unavailable', res.status)
  }
  // Envelope (`{ status:"ok", data }`) or a bare overview — normalize either.
  const payload = body && typeof body === 'object' && 'data' in body ? body.data : body
  return normalizeCloudUsage(payload)
}
