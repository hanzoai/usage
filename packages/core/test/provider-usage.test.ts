// Copyright (c) 2026 Hanzo AI Inc. MIT License.
import { describe, expect, it } from 'vitest'
import { fetchProviderUsage, normalizeProviderUsage, type ProviderUsage } from '../src/provider-usage.js'
import { UsageError } from '../src/cloud-usage.js'

const sample = (): ProviderUsage => ({
  provider: 'openai',
  connected: true,
  available: true,
  currency: 'usd',
  start: '2026-06-01T00:00:00Z',
  end: '2026-07-01T00:00:00Z',
  interval: 'day',
  totals: { spendCents: 142, tokens: 1860, inputTokens: 1550, outputTokens: 310, requests: 6 },
  series: [{ t: '2026-06-01T00:00:00Z', spendCents: 42, tokens: 1260, requests: 4 }],
  byModel: [{ model: 'gpt-4o', spendCents: 0, tokens: 1800, requests: 5 }],
})

const stubFetch = (status: number, body: unknown) => {
  const calls: { url: string; init?: RequestInit }[] = []
  const fn = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init })
    return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
  }) as unknown as typeof fetch
  return { fn, calls }
}

describe('normalizeProviderUsage', () => {
  it('coerces a partial/garbage payload to an honest-zero shape', () => {
    const out = normalizeProviderUsage({ totals: { spendCents: 42 }, series: 'nope', byModel: null }, 'openai')
    expect(out.provider).toBe('openai')
    expect(out.connected).toBe(false)
    expect(out.available).toBe(false)
    expect(out.totals.spendCents).toBe(42)
    expect(out.totals.tokens).toBe(0)
    expect(out.series).toEqual([])
    expect(out.byModel).toEqual([])
    expect(out.currency).toBe('usd')
    expect(out.interval).toBe('day')
  })

  it('preserves connected/available flags and a human note (honest-empty path)', () => {
    const out = normalizeProviderUsage({ provider: 'openai', connected: true, available: false, note: 'needs an Admin API key' })
    expect(out.connected).toBe(true)
    expect(out.available).toBe(false)
    expect(out.note).toBe('needs an Admin API key')
  })

  it('carries through real totals/series/byModel', () => {
    const out = normalizeProviderUsage(sample())
    expect(out.totals.tokens).toBe(1860)
    expect(out.series[0]!.spendCents).toBe(42)
    expect(out.byModel[0]!.model).toBe('gpt-4o')
  })
})

describe('fetchProviderUsage', () => {
  it('reads GET /v1/ai/connections/:provider/usage, unwraps the envelope, forwards params + bearer', async () => {
    const { fn, calls } = stubFetch(200, { status: 'ok', msg: '', data: sample() })
    const out = await fetchProviderUsage({ baseUrl: 'https://api.hanzo.ai/', token: 'tok123', provider: 'openai', from: '2026-06-01', to: '2026-07-01', fetch: fn })
    expect(out.totals.spendCents).toBe(142)
    expect(out.byModel[0]!.model).toBe('gpt-4o')
    const call = calls[0]!
    expect(call.url).toBe('https://api.hanzo.ai/v1/ai/connections/openai/usage?from=2026-06-01&to=2026-07-01')
    expect((call.init!.headers as Record<string, string>).Authorization).toBe('Bearer tok123')
  })

  it('accepts a bare value (no envelope) and fills the provider fallback', async () => {
    const bare = { ...sample(), provider: '' }
    const { fn } = stubFetch(200, bare)
    const out = await fetchProviderUsage({ baseUrl: 'https://api.hanzo.ai', token: 't', provider: 'anthropic', fetch: fn })
    expect(out.provider).toBe('anthropic')
    expect(out.totals.tokens).toBe(1860)
  })

  it('throws a typed UsageError on a status:error body', async () => {
    const { fn } = stubFetch(200, { status: 'error', msg: 'boom' })
    await expect(fetchProviderUsage({ baseUrl: 'https://api.hanzo.ai', token: 't', provider: 'openai', fetch: fn })).rejects.toBeInstanceOf(UsageError)
  })

  it('throws on a transport failure (non-2xx)', async () => {
    const { fn } = stubFetch(503, {})
    await expect(fetchProviderUsage({ baseUrl: 'https://api.hanzo.ai', token: 't', provider: 'openai', fetch: fn })).rejects.toBeInstanceOf(UsageError)
  })
})
