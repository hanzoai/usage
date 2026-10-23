// Copyright (c) 2026 Hanzo AI Inc. MIT License.
import { afterEach, describe, expect, it, vi } from 'vitest'

import { credits, limits, LimitsError } from '../src/limits.js'

const headers = { Authorization: 'Bearer t', 'X-Org-Id': 'acme' }

/** One answer for every request, each request recorded. */
function answer(res: () => Response) {
  const calls: { url: string; init: RequestInit }[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    calls.push({ url: String(url), init })
    return res()
  })
  return calls
}

afterEach(() => vi.unstubAllGlobals())

describe('limits', () => {
  it('reads /v1/ai/limits at the gateway as the headers name, and hands the answer on untouched', async () => {
    const body = { plan: 'max-20x', classes: [{ id: 'premium', share: 0.4 }] }
    const calls = answer(() => Response.json(body))
    expect(await limits('https://api.example/', headers)).toEqual(body)
    expect(calls[0]?.url).toBe('https://api.example/v1/ai/limits')
    expect(calls[0]?.init.headers).toBe(headers)
  })

  it('throws a refusal with its status', async () => {
    answer(() => new Response('', { status: 401 }))
    const e = await limits('https://api.example', headers).catch((x: unknown) => x)
    expect(e).toBeInstanceOf(LimitsError)
    expect(e).toMatchObject({ status: 401, message: 'Limits answered 401' })
  })
})

describe('credits', () => {
  it('PUTs the choice as JSON with the headers it was given', async () => {
    const calls = answer(() => new Response(null, { status: 204 }))
    await credits('https://api.example', headers, true)
    expect(calls[0]?.url).toBe('https://api.example/v1/ai/limits')
    expect(calls[0]?.init.method).toBe('PUT')
    expect(calls[0]?.init.headers).toEqual({ ...headers, 'Content-Type': 'application/json' })
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ creditsAfterAllowance: true })
  })

  it('a refusal says the server’s own words, in each shape the server writes them', async () => {
    for (const body of [{ error: 'Billing is paused.' }, { error: { message: 'Billing is paused.' } }, { message: 'Billing is paused.' }]) {
      answer(() => Response.json(body, { status: 409 }))
      await expect(credits('https://api.example', headers, false)).rejects.toMatchObject({ status: 409, message: 'Billing is paused.' })
    }
  })

  it('a refusal with no words says who may, or the status', async () => {
    answer(() => new Response('<html>', { status: 403 }))
    await expect(credits('https://api.example', headers, true)).rejects.toMatchObject({
      status: 403,
      message: 'Only an organization admin can turn on credits.',
    })
    answer(() => new Response('', { status: 500 }))
    await expect(credits('https://api.example', headers, true)).rejects.toMatchObject({ status: 500, message: 'Credits answered 500' })
  })
})
