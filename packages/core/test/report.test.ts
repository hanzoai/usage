// Copyright (c) 2026 Hanzo AI Inc. MIT License.
import { describe, expect, it } from 'vitest'
import type { ProviderDescriptor } from '../src/provider.js'
import type { UsageSnapshot } from '../src/types.js'
import { UsageStore } from '../src/store.js'
import { accountKind, linkPayload, usageOf, Reporter, type ReporterConfig } from '../src/report.js'
import { mockHost, type MockHost } from './mock-host.js'

const claudeSnap: UsageSnapshot = {
  providerId: 'claude',
  primary: { usedPercent: 42, windowMinutes: 300, resetsAt: '2026-07-07T17:00:00Z' },
  secondary: { usedPercent: 12, windowMinutes: 10080 },
  identity: { providerId: 'claude', accountEmail: 'me@anthropic.com', loginMethod: 'oauth', plan: 'Claude Max' },
  totals: { tokens: 1000, inputTokens: 600, outputTokens: 400 },
  dataConfidence: 'exact',
  updatedAt: '2026-07-07T12:00:00.000Z',
}

const hanzoSnap: UsageSnapshot = {
  providerId: 'hanzo',
  identity: { providerId: 'hanzo', loginMethod: 'iam' },
  providerCost: { used: 1.5, currencyCode: 'USD', period: 'monthly', updatedAt: '2026-07-07T12:00:00.000Z' },
  totals: { tokens: 500 },
  dataConfidence: 'exact',
  updatedAt: '2026-07-07T12:00:00.000Z',
}

const stub = (id: string, snap: UsageSnapshot): ProviderDescriptor => ({
  id,
  metadata: { displayName: id, sessionLabel: 'Session', weeklyLabel: 'Weekly' },
  strategies: () => [
    {
      id: `${id}.stub`,
      kind: 'localProbe',
      isAvailable: async () => true,
      fetch: async () => ({ usage: snap, sourceLabel: 'stub', strategyId: `${id}.stub`, strategyKind: 'localProbe' as const }),
    },
  ],
})

async function storeWith(...snaps: UsageSnapshot[]): Promise<UsageStore> {
  const store = new UsageStore({ host: mockHost(), providers: snaps.map((s) => stub(s.providerId, s)) })
  await store.refresh()
  return store
}

function reporter(store: UsageStore, host: MockHost, token: string | undefined): Reporter {
  const cfg: ReporterConfig = {
    host,
    baseUrl: 'https://api.hanzo.ai/',
    getToken: () => token,
    machine: 'machine-1',
    hostname: 'box.local',
    os: 'darwin',
  }
  return new Reporter(store, cfg)
}

describe('accountKind', () => {
  it('subscription providers bill the plan; hanzo + api providers bill commerce', () => {
    expect(accountKind('claude', claudeSnap)).toBe('subscription')
    expect(accountKind('codex')).toBe('subscription')
    expect(accountKind('hanzo', hanzoSnap)).toBe('apikey')
    expect(accountKind('openai')).toBe('apikey')
    expect(accountKind('unknown-provider')).toBe('apikey') // never silently free
  })
  it('an api-token login on a subscription provider is an api-key account', () => {
    const apiClaude: UsageSnapshot = { ...claudeSnap, identity: { providerId: 'claude', loginMethod: 'apiToken' } }
    expect(accountKind('claude', apiClaude)).toBe('apikey')
  })
})

describe('usageOf', () => {
  it('projects rate windows, tokens, and spend (cents = provider cost * 100)', () => {
    expect(usageOf(claudeSnap)).toMatchObject({ sessionPct: 42, weeklyPct: 12, tokens: 1000, spendCents: 0 })
    expect(usageOf(hanzoSnap)).toMatchObject({ spendCents: 150, currency: 'USD', tokens: 500 })
  })
})

describe('linkPayload', () => {
  it('builds the upsert body from a snapshot, null when not signed in', () => {
    const cfg = { host: mockHost(), baseUrl: 'x', getToken: () => 't', machine: 'm', hostname: 'h', os: 'linux' }
    const p = linkPayload('claude', { snapshot: claudeSnap, refreshing: false }, cfg)
    expect(p).toMatchObject({
      machine: 'm', host: 'h', os: 'linux', provider: 'claude',
      account: 'me@anthropic.com', plan: 'Claude Max', kind: 'subscription',
    })
    expect(p?.usage?.sessionPct).toBe(42)
    expect(linkPayload('claude', { refreshing: false }, cfg)).toBeNull()
  })
})

describe('Reporter.report', () => {
  it('upserts one link per signed-in account, with the bearer, to /v1/links', async () => {
    const store = await storeWith(claudeSnap, hanzoSnap)
    const host = mockHost({ responses: { 'https://api.hanzo.ai/v1/links': { status: 201, headers: {}, text: '{}' } } })
    const out = await reporter(store, host, 'tok-123').report()

    expect(out.reported).toBe(2)
    expect(out.errors).toEqual([])
    expect(host.requests).toHaveLength(2)
    for (const req of host.requests) {
      expect(req.url).toBe('https://api.hanzo.ai/v1/links')
      expect(req.method).toBe('POST')
      expect(req.headers?.Authorization).toBe('Bearer tok-123')
    }
    const bodies = host.requests.map((r) => JSON.parse(r.body ?? '{}'))
    const claude = bodies.find((b) => b.provider === 'claude')
    const hanzo = bodies.find((b) => b.provider === 'hanzo')
    expect(claude).toMatchObject({ kind: 'subscription', account: 'me@anthropic.com', machine: 'machine-1' })
    expect(hanzo).toMatchObject({ kind: 'apikey' })
    // The reporter NEVER sends a provider secret — only whitelisted metadata +
    // usage counts (the word "tokens" is a usage count, not a credential).
    const allowed = new Set(['machine', 'host', 'os', 'provider', 'account', 'plan', 'kind', 'usage'])
    for (const b of bodies) {
      // The body carries ONLY whitelisted metadata + usage — no credential field —
      // and the bearer token value never appears in the body (headers only).
      for (const k of Object.keys(b)) expect(allowed.has(k)).toBe(true)
      expect(JSON.stringify(b)).not.toContain('tok-123')
    }
  })

  it('a missing bearer is an honest no-op (nothing registered, no error)', async () => {
    const store = await storeWith(claudeSnap)
    const host = mockHost()
    const out = await reporter(store, host, undefined).report()
    expect(out.reported).toBe(0)
    expect(out.skipped).toBe(1)
    expect(host.requests).toHaveLength(0)
  })

  it('a non-2xx upstream is recorded as an error, not a throw', async () => {
    const store = await storeWith(claudeSnap)
    const host = mockHost({ responses: { 'https://api.hanzo.ai/v1/links': { status: 500, headers: {}, text: 'boom' } } })
    const out = await reporter(store, host, 'tok').report()
    expect(out.reported).toBe(0)
    expect(out.errors).toHaveLength(1)
    expect(out.errors[0]?.provider).toBe('claude')
  })
})
