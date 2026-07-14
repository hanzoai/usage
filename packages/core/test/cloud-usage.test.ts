// Copyright (c) 2026 Hanzo AI Inc. MIT License.
import { describe, expect, it } from 'vitest'
import { fetchCloudUsage, normalizeCloudUsage, UsageError, type CloudUsageOverview } from '../src/cloud-usage.js'

const sampleOverview = (): CloudUsageOverview => ({
  range: '7d',
  start: '2026-07-01T00:00:00Z',
  end: '2026-07-08T00:00:00Z',
  interval: 'day',
  scope: { org: 'hanzo', allOrgs: false },
  totals: { tokens: 1000, promptTokens: 600, completionTokens: 400, requests: 12, spendCents: 345, models: 3, providers: 2 },
  deltas: { spendCents: { current: 345, prior: 300, pct: 15 }, tokens: { current: 1000, prior: 0, pct: null } },
  series: [{ t: '2026-07-01T00:00:00Z', tokens: 500, spendCents: 200, requests: 6, models: 2 }],
  byModel: { items: [{ model: 'gpt-4o', provider: 'openai', spendCents: 200, tokens: 500, requests: 6, pct: 58 }], other: null, totalCents: 345 },
  activity: { items: [], limit: 20, offset: 0, total: 0, type: 'all' },
})

// A minimal fetch stub: one canned Response, capturing the URL + init it was called with.
const stubFetch = (status: number, body: unknown) => {
  const calls: { url: string; init?: RequestInit }[] = []
  const fn = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init })
    return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
  }) as unknown as typeof fetch
  return { fn, calls }
}

describe('normalizeCloudUsage', () => {
  it('coerces a partial/garbage payload to a complete honest-zero shape', () => {
    const out = normalizeCloudUsage({ totals: { spendCents: 42 }, series: 'nope', byModel: null })
    expect(out.totals.spendCents).toBe(42)
    expect(out.totals.tokens).toBe(0)
    expect(out.series).toEqual([])
    expect(out.byModel.items).toEqual([])
    expect(out.byModel.other).toBeNull()
    expect(out.interval).toBe('day')
    expect(out.activity.items).toEqual([])
  })

  it('preserves a null delta pct (no basis) rather than fabricating a ratio', () => {
    const out = normalizeCloudUsage({ deltas: { tokens: { current: 5, prior: 0, pct: null }, spendCents: { current: 5, prior: 4, pct: 25 } } })
    expect(out.deltas.tokens!.pct).toBeNull()
    expect(out.deltas.spendCents!.pct).toBe(25)
  })
})

describe('fetchCloudUsage', () => {
  it('reads GET /v1/get-cloud-usages, unwraps the {status,data} envelope, and forwards params + bearer', async () => {
    const { fn, calls } = stubFetch(200, { status: 'ok', msg: '', data: sampleOverview() })
    const out = await fetchCloudUsage({ baseUrl: 'https://api.hanzo.ai/', token: 'tok123', range: '7d', org: 'hanzo', topModels: 6, fetch: fn })
    expect(out.totals.spendCents).toBe(345)
    expect(out.byModel.items[0]!.model).toBe('gpt-4o')
    const call = calls[0]!
    expect(call.url).toBe('https://api.hanzo.ai/v1/get-cloud-usages?range=7d&org=hanzo&topModels=6')
    expect((call.init!.headers as Record<string, string>).Authorization).toBe('Bearer tok123')
  })

  it('accepts a bare overview (no envelope)', async () => {
    const { fn } = stubFetch(200, sampleOverview())
    const out = await fetchCloudUsage({ baseUrl: 'https://api.hanzo.ai', token: 't', fetch: fn })
    expect(out.totals.requests).toBe(12)
  })

  it('throws a typed UsageError on a status:error body (datastore peer down)', async () => {
    const { fn } = stubFetch(200, { status: 'error', msg: 'usage ledger unavailable: datastore peer not connected', data: null })
    await expect(fetchCloudUsage({ baseUrl: 'https://api.hanzo.ai', token: 't', fetch: fn })).rejects.toThrowError(
      /datastore peer not connected/,
    )
  })

  it('throws a typed UsageError carrying the HTTP status on a transport failure', async () => {
    const { fn } = stubFetch(403, { status: 'error', msg: 'Please sign in first' })
    await expect(fetchCloudUsage({ baseUrl: 'https://api.hanzo.ai', token: 't', fetch: fn })).rejects.toMatchObject({
      name: 'UsageError',
      status: 403,
    })
    // UsageError is exported and instanceof-checkable.
    const err = await fetchCloudUsage({ baseUrl: 'https://api.hanzo.ai', token: 't', fetch: fn }).catch((e) => e)
    expect(err).toBeInstanceOf(UsageError)
  })
})
