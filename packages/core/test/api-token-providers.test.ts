// Copyright (c) 2026 Hanzo AI Inc. MIT License.
import { describe, expect, it } from 'vitest'
import { runPipeline } from '../src/provider.js'
import { makeApiTokenProvider } from '../src/providers/api-token.js'
import {
  openrouterProvider,
  deepseekProvider,
  elevenlabsProvider,
  openaiProvider,
  litellmProvider,
  llmproxyProvider,
} from '../src/providers/api-token-providers.js'
import { groqProvider } from '../src/providers/groq.js'
import { deepgramProvider } from '../src/providers/deepgram.js'
import { byoProvider } from '../src/providers/byo.js'
import { json, mockHost } from './mock-host.js'

const run = (provider: Parameters<typeof runPipeline>[0], host: ReturnType<typeof mockHost>, settings?: Record<string, unknown>) =>
  runPipeline(provider, { host, sourceMode: 'auto', settings })

describe('makeApiTokenProvider factory', () => {
  const probe = makeApiTokenProvider({
    id: 'probe',
    metadata: { displayName: 'Probe', sessionLabel: 'a', weeklyLabel: 'b' },
    envKeys: ['PROBE_KEY'],
    request: (s) => ({ url: 'https://probe.test/usage', headers: { Authorization: `Bearer ${s.apiKey}` } }),
    map: () => ({ usage: { dataConfidence: 'exact' }, credits: { remaining: 9 } }),
  })

  it('stamps providerId + updatedAt and resolves the key from settings', async () => {
    const host = mockHost({ responses: { 'https://probe.test/usage': json({}) }, now: '2026-07-07T12:00:00Z' })
    const out = await run(probe, host, { apiKey: 'k' })
    expect(out.error).toBeUndefined()
    expect(out.result?.usage.providerId).toBe('probe')
    expect(out.result?.usage.updatedAt).toBe('2026-07-07T12:00:00.000Z')
    expect(out.result?.credits?.remaining).toBe(9)
    expect(out.result?.credits?.updatedAt).toBe('2026-07-07T12:00:00.000Z')
    expect(host.requests[0]?.headers?.Authorization).toBe('Bearer k')
  })

  it('falls back to an env var for the key', async () => {
    const host = mockHost({ responses: { 'https://probe.test/usage': json({}) }, env: { PROBE_KEY: 'from-env' } })
    const out = await run(probe, host)
    expect(host.requests[0]?.headers?.Authorization).toBe('Bearer from-env')
  })

  it('skips when no key is present', async () => {
    const out = await run(probe, mockHost())
    expect(out.result).toBeUndefined()
    expect(out.attempts).toMatchObject([{ strategyId: 'probe.apiToken', skipped: true }])
  })
})

describe('openrouter provider', () => {
  it('maps /credits balance with Bearer auth', async () => {
    const host = mockHost({
      responses: { 'https://openrouter.ai/api/v1/credits': json({ data: { total_credits: 100, total_usage: 30 } }) },
    })
    const out = await run(openrouterProvider, host, { apiKey: 'sk-or-v1-x' })
    expect(out.result?.usage.providerCost).toMatchObject({ used: 30, limit: 100, currencyCode: 'USD' })
    expect(out.result?.credits?.remaining).toBe(70)
    expect(host.requests[0]?.headers?.Authorization).toBe('Bearer sk-or-v1-x')
  })
})

describe('deepseek provider', () => {
  it('parses the string balance and prefers a positive USD row', async () => {
    const host = mockHost({
      responses: {
        'https://api.deepseek.com/user/balance': json({
          is_available: true,
          balance_infos: [
            { currency: 'CNY', total_balance: '5.00' },
            { currency: 'USD', total_balance: '42.50', granted_balance: '0', topped_up_balance: '42.50' },
          ],
        }),
      },
    })
    const out = await run(deepseekProvider, host, { apiKey: 'sk-ds' })
    expect(out.result?.credits?.remaining).toBe(42.5)
    expect(out.result?.usage.identity?.plan).toBe('USD')
  })
})

describe('elevenlabs provider', () => {
  it('uses the xi-api-key header and maps character usage + reset', async () => {
    const host = mockHost({
      responses: {
        'https://api.elevenlabs.io/v1/user/subscription': json({
          tier: 'creator',
          character_count: 1000,
          character_limit: 4000,
          next_character_count_reset_unix: 1783468800,
        }),
      },
    })
    const out = await run(elevenlabsProvider, host, { apiKey: 'xi-secret' })
    expect(out.result?.usage.primary?.usedPercent).toBe(25)
    expect(out.result?.usage.identity?.plan).toBe('creator')
    expect(out.result?.usage.primary?.resetsAt).toBe('2026-07-08T00:00:00.000Z')
    expect(host.requests[0]?.headers?.['xi-api-key']).toBe('xi-secret')
    expect(host.requests[0]?.headers?.Authorization).toBeUndefined()
  })
})

describe('openai provider', () => {
  it('maps the credit_grants balance endpoint', async () => {
    const host = mockHost({
      responses: {
        'https://api.openai.com/v1/dashboard/billing/credit_grants': json({
          total_granted: 100,
          total_used: 40,
          total_available: 60,
        }),
      },
    })
    const out = await run(openaiProvider, host, { apiKey: 'sk-oa' })
    expect(out.result?.usage.primary?.usedPercent).toBe(40)
    expect(out.result?.usage.providerCost).toMatchObject({ used: 40, limit: 100 })
    expect(out.result?.credits?.remaining).toBe(60)
  })
})

describe('litellm provider (self-hosted)', () => {
  it('strips a trailing /v1 and reads /key/info', async () => {
    const host = mockHost({
      responses: {
        'https://llm.example.com/key/info': json({
          info: { key_name: 'prod', spend: 12.5, expires: '2026-12-31T00:00:00Z', user_id: 'u1', team_id: 't1' },
        }),
      },
    })
    const out = await run(litellmProvider, host, { apiKey: 'sk-lite', baseUrl: 'https://llm.example.com/v1' })
    expect(out.result?.usage.providerCost).toMatchObject({ used: 12.5, currencyCode: 'USD' })
    expect(out.result?.usage.identity?.plan).toBe('prod')
    expect(out.result?.usage.subscriptionExpiresAt).toBe('2026-12-31T00:00:00Z')
  })

  it('is unavailable without a base URL', async () => {
    const out = await run(litellmProvider, mockHost(), { apiKey: 'sk-lite' })
    expect(out.result).toBeUndefined()
    expect(out.attempts).toMatchObject([{ strategyId: 'litellm.apiToken', skipped: true }])
  })
})

describe('llmproxy provider (self-hosted)', () => {
  it('aggregates quota-stats into a used% + totals + spend', async () => {
    const host = mockHost({
      responses: {
        'https://proxy.example.com/v1/quota-stats': json({
          providers: {
            openai: {
              total_requests: 10,
              approx_cost: 1.5,
              tokens: { input_cached: 5, input_uncached: 10, output: 20 },
              quota_groups: [{ remaining_percent: 40, reset_time: '2026-07-08T00:00:00Z' }],
            },
          },
          summary: { total_requests: 10, total_tokens: 35, approx_cost: 1.5 },
        }),
      },
    })
    const out = await run(llmproxyProvider, host, { apiKey: 'k', baseUrl: 'https://proxy.example.com' })
    expect(out.result?.usage.primary).toMatchObject({ usedPercent: 60, resetsAt: '2026-07-08T00:00:00Z' })
    expect(out.result?.usage.totals).toMatchObject({ tokens: 35, requests: 10 })
    expect(out.result?.usage.providerCost?.used).toBe(1.5)
  })
})

describe('groq provider (prometheus throughput)', () => {
  it('sums the rate queries into per-minute throughput', async () => {
    const q = (promql: string) =>
      `https://api.groq.com/v1/metrics/prometheus/api/v1/query?query=${encodeURIComponent(promql)}`
    const host = mockHost({
      responses: {
        [q('sum(model_project_id_status_code:requests:rate5m)')]: json({ status: 'success', data: { result: [{ value: [1, '2'] }] } }),
        [q('sum(model_project_id:tokens_in:rate5m)')]: json({ status: 'success', data: { result: [{ value: [1, '5'] }] } }),
        [q('sum(model_project_id:tokens_out:rate5m)')]: json({ status: 'success', data: { result: [{ value: [1, '3'] }] } }),
      },
    })
    const out = await run(groqProvider, host, { apiKey: 'gsk' })
    expect(out.result?.usage.totals).toMatchObject({ requests: 120, tokens: 480 })
    expect(host.requests[0]?.headers?.Authorization).toBe('Bearer gsk')
  })
})

describe('deepgram provider (projects → usage chain)', () => {
  it('enumerates projects and aggregates usage with the Token scheme', async () => {
    const host = mockHost({
      responses: {
        'https://api.deepgram.com/v1/projects': json({ projects: [{ project_id: 'p1', name: 'Proj' }] }),
        'https://api.deepgram.com/v1/projects/p1/usage/breakdown': json({
          results: [{ requests: 10, total_hours: 2, tokens_in: 100, tokens_out: 50 }],
        }),
      },
    })
    const out = await run(deepgramProvider, host, { apiKey: 'dg-key' })
    expect(out.result?.usage.totals).toMatchObject({ tokens: 150, requests: 10 })
    expect(host.requests[0]?.headers?.Authorization).toBe('Token dg-key')
  })
})

describe('byo provider (fallback chain)', () => {
  it('prefers /key/info when it returns spend', async () => {
    const host = mockHost({
      responses: { 'https://gpu.example.com/key/info': json({ info: { spend: 5, key_name: 'k1' } }) },
    })
    const out = await run(byoProvider, host, { apiKey: 'k', baseUrl: 'https://gpu.example.com/v1' })
    expect(out.result?.sourceLabel).toBe('BYO /key/info')
    expect(out.result?.usage.providerCost?.used).toBe(5)
    expect(out.result?.usage.dataConfidence).toBe('exact')
  })

  it('falls back to /v1/models liveness (unknown confidence)', async () => {
    const host = mockHost({
      responses: { 'https://gpu.example.com/v1/models': json({ data: [{ id: 'm1' }, { id: 'm2' }] }) },
    })
    const out = await run(byoProvider, host, { apiKey: 'k', baseUrl: 'https://gpu.example.com' })
    expect(out.result?.sourceLabel).toBe('BYO liveness')
    expect(out.result?.usage.dataConfidence).toBe('unknown')
    expect(out.result?.usage.identity?.accountOrganization).toBe('2 models')
  })

  it('is unavailable without a base URL', async () => {
    const out = await run(byoProvider, mockHost(), { apiKey: 'k' })
    expect(out.result).toBeUndefined()
  })
})
