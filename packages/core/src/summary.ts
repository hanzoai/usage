// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// Org usage — EVERYTHING the org ran, not only what it inferred.
//
// The server owns the shape: `GET /v1/usage/summary` (hanzoai/cloud
// apps/usage/query.go) rolls the commerce ledger up by category, gap-fills a
// spend series over the window, and answers the wallet's month-to-date, overage
// and balance beside the org's Hanzo-routed inference totals.
//
// It is a DIFFERENT QUESTION from cloud-usage.ts, not a newer answer to the same
// one. That file reads the AI service's own ledger and is shaped around models —
// spend-by-model, per-model activity. This one is shaped around CATEGORIES, and
// the mapper behind it buckets llm, compute and storage (query.go), so a bill
// that includes a database and a machine says so instead of showing the
// inference line and calling it the total. Per-model detail is deliberately not
// here; the server's own comment sends that to /v1/event/*.
//
// Both are kept because a billing page wants this one and a model breakdown
// wants the other. Folding them would make one of the two lie.

/** A typed failure from a usage read — carries the HTTP status when there was one. */
export class UsageSummaryError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'UsageSummaryError'
    this.status = status
  }
}

/** One ledger category's share of the window — `llm`, `compute`, `storage`, … */
export interface CategorySpend {
  category: string
  amountCents: number
}

/** One gap-filled bucket of the spend series. */
export interface SpendPoint {
  t: string
  amountCents: number
}

/**
 * The categorized cost roll-up.
 *
 * `available` false means the ledger was unconfigured or unreachable, and every
 * number below is an honest zero rather than a measured one — the distinction a
 * dashboard needs to avoid drawing "spent nothing" over "could not ask".
 */
export interface Spend {
  available: boolean
  totalCents: number
  /** Commerce's authoritative month-to-date figure — a DIFFERENT period from the
   *  window, and not derived from it. */
  mtdCents: number
  overageCents: number
  balanceCents: number
  availableCents: number
  byCategory: CategorySpend[]
  series: SpendPoint[]
  source: string
}

/** The org's Hanzo-routed inference totals. KPI band, not a breakdown. */
export interface LLMTotals {
  available: boolean
  requests: number
  tokens: number
  promptTokens: number
  completionTokens: number
}

/** Which upstreams actually answered, so a zero can be read honestly. */
export interface Sources {
  [name: string]: boolean | string | undefined
}

export interface UsageScope {
  org?: string
  allOrgs?: boolean
  subject?: string
}

export interface UsageSummary {
  start: string
  end: string
  interval: string
  scope: UsageScope
  spend: Spend
  llm: LLMTotals
  accounts?: unknown
  sources?: Sources
}

/** WHERE THE ORG-WIDE ROLL-UP IS READ FROM. One constant, for the same reason
 *  cloud-usage.ts has one: a path at its call site is a path that gets missed. */
const USAGE_SUMMARY_PATH = '/v1/usage/summary'

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/**
 * Coerce a partial or errored payload into a complete, honest-zero shape.
 *
 * `available` is preserved rather than inferred: a roll-up that could not be
 * taken and one that measured nothing are the same numbers and different facts,
 * and only the server can tell them apart.
 */
export function normalizeUsageSummary(input: unknown): UsageSummary {
  const o = (input ?? {}) as Record<string, unknown>
  const sp = (o.spend ?? {}) as Record<string, unknown>
  const llm = (o.llm ?? {}) as Record<string, unknown>
  return {
    start: str(o.start),
    end: str(o.end),
    interval: str(o.interval),
    scope: (o.scope ?? {}) as UsageScope,
    spend: {
      available: sp.available === true,
      totalCents: num(sp.totalCents),
      mtdCents: num(sp.mtdCents),
      overageCents: num(sp.overageCents),
      balanceCents: num(sp.balanceCents),
      availableCents: num(sp.availableCents),
      byCategory: Array.isArray(sp.byCategory)
        ? (sp.byCategory as unknown[]).map((c) => {
            const r = (c ?? {}) as Record<string, unknown>
            return { category: str(r.category), amountCents: num(r.amountCents) }
          })
        : [],
      series: Array.isArray(sp.series)
        ? (sp.series as unknown[]).map((p) => {
            const r = (p ?? {}) as Record<string, unknown>
            return { t: str(r.t), amountCents: num(r.amountCents) }
          })
        : [],
      source: str(sp.source),
    },
    llm: {
      available: llm.available === true,
      requests: num(llm.requests),
      tokens: num(llm.tokens),
      promptTokens: num(llm.promptTokens),
      completionTokens: num(llm.completionTokens),
    },
    accounts: o.accounts,
    sources: (o.sources ?? undefined) as Sources | undefined,
  }
}

export interface FetchUsageSummaryOptions {
  baseUrl: string
  token?: string
  range?: string
  org?: string
  fetch?: typeof globalThis.fetch
  signal?: AbortSignal
}

/**
 * Read the org-wide roll-up from `GET {baseUrl}/v1/usage/summary`. Unwraps the
 * `{status,data}` envelope when there is one and accepts a bare object when
 * there is not, which is the same contract cloud-usage.ts reads under.
 */
export async function fetchUsageSummary(opts: FetchUsageSummaryOptions): Promise<UsageSummary> {
  const doFetch = opts.fetch ?? globalThis.fetch
  if (!doFetch) throw new UsageSummaryError('no fetch implementation available')
  const base = opts.baseUrl.replace(/\/+$/, '')
  const q = new URLSearchParams()
  if (opts.range) q.set('range', opts.range)
  if (opts.org) q.set('org', opts.org)
  const query = q.toString()

  const res = await doFetch(`${base}${USAGE_SUMMARY_PATH}${query ? `?${query}` : ''}`, {
    headers: opts.token ? { authorization: `Bearer ${opts.token}` } : {},
    signal: opts.signal,
  })
  if (!res.ok) throw new UsageSummaryError(`GET ${USAGE_SUMMARY_PATH} HTTP ${res.status}`, res.status)

  const body = (await res.json()) as Record<string, unknown>
  const payload = body && typeof body === 'object' && 'data' in body ? body.data : body
  return normalizeUsageSummary(payload)
}
