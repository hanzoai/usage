// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// The Free plan's allowance — what the CALLER has left of it, and the pool it
// comes from.
//
// The server owns the shape: `GET /v1/allowance` (hanzoai/cloud
// apps/allowance). The Free plan is limited usage from ONE pool every free user
// shares — the platform's vendor accounts for free models — so a free caller's
// answer is `pooled` and carries that pool's standing beside their own count. A
// paid plan is not pooled: its usage is metered in money, and this read says so
// by answering `limit: 0`.
//
// Nothing here is invented. An absent pool is drawn as absent, never as
// "available".

/** A typed failure from the allowance read — carries the HTTP status when there was one. */
export class AllowanceError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AllowanceError'
    this.status = status
  }
}

/** The free pool's state, as its accounts last said. */
export type PoolState = 'available' | 'busy' | 'exhausted'

/** The free pool's standing: the platform's vendor accounts for free models, as one. */
export interface Pool {
  state: PoolState
  /** When the pool refills (ms since epoch): stated when exhausted, or busy for under a minute. */
  resets: number | null
}

/** What a caller has left of their plan's free calls, and the pool behind them. */
export interface Allowance {
  /** The plan the ceiling came from: free, pro, … */
  plan: string
  /** Calls allowed in `window`; 0 means the plan does not bound them. */
  limit: number
  /** Calls served in `window`. */
  used: number
  /** At the limit. */
  spent: boolean
  /** Which ceiling these numbers describe: "hour" or "day"; "" when none binds. */
  window: string
  /** When `window` starts again (ms since epoch), or null. */
  resets: number | null
  /** Served from the pool every free user shares. */
  pooled: boolean
  /** That pool's standing, where the server could read it. */
  pool: Pool | null
}

const ALLOWANCE_PATH = '/v1/allowance'

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const at = (unix: unknown): number | null => (num(unix) > 0 ? num(unix) * 1000 : null)
const STATES: readonly PoolState[] = ['available', 'busy', 'exhausted']

/** Coerce the server's answer into a complete shape; an unknown pool state is no pool. */
export function normalizeAllowance(input: unknown): Allowance {
  const o = (input ?? {}) as Record<string, unknown>
  const p = o.pool && typeof o.pool === 'object' ? (o.pool as Record<string, unknown>) : null
  const state = str(p?.state) as PoolState
  return {
    plan: str(o.plan),
    limit: num(o.limit),
    used: num(o.used),
    spent: o.spent === true,
    window: str(o.window),
    resets: at(o.resets),
    pooled: o.pooled === true,
    pool: p && STATES.includes(state) ? { state, resets: at(p.resets) } : null,
  }
}

export interface FetchAllowanceOptions {
  baseUrl: string
  token?: string
  fetch?: typeof globalThis.fetch
  signal?: AbortSignal
}

/** Read the caller's allowance from `GET {baseUrl}/v1/allowance`. */
export async function fetchAllowance(opts: FetchAllowanceOptions): Promise<Allowance> {
  const doFetch = opts.fetch ?? globalThis.fetch
  if (!doFetch) throw new AllowanceError('no fetch implementation available')
  const base = opts.baseUrl.replace(/\/+$/, '')
  const res = await doFetch(`${base}${ALLOWANCE_PATH}`, {
    headers: opts.token ? { authorization: `Bearer ${opts.token}` } : {},
    signal: opts.signal,
  })
  if (!res.ok) throw new AllowanceError(`GET ${ALLOWANCE_PATH} HTTP ${res.status}`, res.status)
  const body = (await res.json()) as Record<string, unknown>
  const payload = body && typeof body === 'object' && 'data' in body && !('limit' in body) ? body.data : body
  return normalizeAllowance(payload)
}

/** "this hour" / "today" — the window as a person reads it. */
export function windowWords(window: string): string {
  return window === 'hour' ? 'this hour' : window === 'day' ? 'today' : 'this period'
}

/** "15:00 UTC", or "Sep 29, 00:00 UTC" when not today — a reset as a person reads it. */
export function resetWords(ms: number | null, now: number = Date.now()): string {
  if (ms === null) return ''
  const d = new Date(ms)
  const n = new Date(now)
  const hhmm = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
  const same = d.getUTCFullYear() === n.getUTCFullYear() && d.getUTCMonth() === n.getUTCMonth() && d.getUTCDate() === n.getUTCDate()
  if (same) return hhmm
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  return `${month} ${d.getUTCDate()}, ${hhmm}`
}

/** What the pool's state means to a person sharing it. */
export function poolWords(p: Pool, now: number = Date.now()): string {
  const when = resetWords(p.resets, now)
  switch (p.state) {
    case 'available':
      return 'Available'
    case 'busy':
      return 'Busy — try again in a minute'
    case 'exhausted':
      return `Used up${when ? ` until ${when}` : ' for now'}`
  }
}
