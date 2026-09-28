// Copyright (c) 2026 Hanzo AI Inc. MIT License.
import { describe, expect, it } from 'vitest'

import { fetchAllowance, normalizeAllowance, poolWords, resetWords } from '../src/allowance.js'

const free = {
  plan: 'free',
  limit: 10,
  used: 3,
  spent: false,
  window: 'hour',
  resets: 1790604000, // 2026-09-28T16:00:00Z
  pooled: true,
  pool: { state: 'busy', keys: 3, ready: 2, resets: 1790640000 },
}

describe('normalizeAllowance', () => {
  it('reads a Free caller as pooled with the pool the server said', () => {
    const a = normalizeAllowance(free)
    expect(a).toMatchObject({ plan: 'free', limit: 10, used: 3, window: 'hour', pooled: true })
    expect(a.resets).toBe(1790604000 * 1000)
    expect(a.pool).toEqual({ state: 'busy', keys: 3, ready: 2, resets: 1790640000 * 1000 })
  })

  it('draws no pool it was not given, and none in a state it does not know', () => {
    expect(normalizeAllowance({ ...free, pool: undefined }).pool).toBeNull()
    expect(normalizeAllowance({ ...free, pool: { state: 'fine', keys: 3, ready: 3 } }).pool).toBeNull()
  })

  it('reads a paid plan as not pooled', () => {
    const a = normalizeAllowance({ plan: 'pro', limit: 0, used: 0, spent: false, resets: 1790640000, pooled: false })
    expect(a.pooled).toBe(false)
    expect(a.limit).toBe(0)
  })
})

describe('words', () => {
  const now = Date.UTC(2026, 8, 28, 15, 20)
  it('says a reset today as a time and a later one with its date', () => {
    expect(resetWords(Date.UTC(2026, 8, 28, 16, 0), now)).toBe('16:00 UTC')
    expect(resetWords(Date.UTC(2026, 8, 29, 0, 0), now)).toBe('Sep 29, 00:00 UTC')
    expect(resetWords(null, now)).toBe('')
  })
  it('says the pool state and how many accounts serve', () => {
    expect(poolWords({ state: 'available', keys: 3, ready: 3, resets: null }, now)).toBe('Available · 3 of 3 accounts serving')
    expect(poolWords({ state: 'exhausted', keys: 3, ready: 0, resets: Date.UTC(2026, 8, 29) }, now)).toBe(
      'Exhausted until Sep 29, 00:00 UTC · 0 of 3 accounts serving',
    )
  })
})

describe('fetchAllowance', () => {
  it('reads GET /v1/allowance with the bearer', async () => {
    let asked = ''
    let auth = ''
    const a = await fetchAllowance({
      baseUrl: 'https://api.hanzo.ai/',
      token: 't0k',
      fetch: (async (url: string, init?: RequestInit) => {
        asked = url
        auth = (init?.headers as Record<string, string>).authorization
        return new Response(JSON.stringify(free), { status: 200 })
      }) as typeof fetch,
    })
    expect(asked).toBe('https://api.hanzo.ai/v1/allowance')
    expect(auth).toBe('Bearer t0k')
    expect(a.pooled).toBe(true)
  })
  it('fails typed on a refusal', async () => {
    await expect(
      fetchAllowance({ baseUrl: 'https://api.hanzo.ai', fetch: (async () => new Response('', { status: 401 })) as typeof fetch }),
    ).rejects.toMatchObject({ name: 'AllowanceError', status: 401 })
  })
})
