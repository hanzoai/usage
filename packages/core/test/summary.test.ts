import { describe, it, expect } from 'vitest'
import { fetchUsageSummary, normalizeUsageSummary } from '../src/summary'

describe('normalizeUsageSummary', () => {
  it('coerces a partial payload to a complete honest-zero shape', () => {
    const s = normalizeUsageSummary({ spend: { totalCents: 250 } })
    expect(s.spend.totalCents).toBe(250)
    expect(s.spend.byCategory).toEqual([])
    expect(s.llm.tokens).toBe(0)
  })

  // The distinction the whole dashboard rests on: a roll-up that could not be
  // taken and one that measured nothing are the same numbers and different
  // facts. Inferring `available` from the numbers would erase that.
  it('keeps available=false rather than inferring it from zeros', () => {
    expect(normalizeUsageSummary({ spend: { available: false, totalCents: 0 } }).spend.available).toBe(false)
    expect(normalizeUsageSummary({ spend: { available: true, totalCents: 0 } }).spend.available).toBe(true)
  })

  it('carries every category, which is the point of reading this instead of the AI ledger', () => {
    const s = normalizeUsageSummary({
      spend: { byCategory: [
        { category: 'llm', amountCents: 900 },
        { category: 'compute', amountCents: 400 },
        { category: 'storage', amountCents: 100 },
      ] },
    })
    expect(s.spend.byCategory.map((c) => c.category)).toEqual(['llm', 'compute', 'storage'])
  })
})

describe('fetchUsageSummary', () => {
  it('reads GET /v1/usage/summary, unwraps the envelope, and forwards params + bearer', async () => {
    let call: { url: string; init: RequestInit } | undefined
    const fake = (async (url: string, init: RequestInit) => {
      call = { url, init }
      return {
        ok: true,
        json: async () => ({ status: 'ok', data: { start: 'a', spend: { available: true, totalCents: 7 } } }),
      } as unknown as Response
    }) as unknown as typeof globalThis.fetch

    const out = await fetchUsageSummary({
      baseUrl: 'https://api.hanzo.ai/', token: 't', range: '7d', org: 'hanzo', fetch: fake,
    })
    expect(call!.url).toBe('https://api.hanzo.ai/v1/usage/summary?range=7d&org=hanzo')
    expect((call!.init.headers as Record<string, string>).authorization).toBe('Bearer t')
    expect(out.spend.totalCents).toBe(7)
  })

  it('throws naming the path it asked for, so the error points somewhere real', async () => {
    const fake = (async () => ({ ok: false, status: 404 }) as unknown as Response) as unknown as typeof globalThis.fetch
    await expect(fetchUsageSummary({ baseUrl: 'https://api.hanzo.ai', fetch: fake }))
      .rejects.toThrow('/v1/usage/summary')
  })
})
