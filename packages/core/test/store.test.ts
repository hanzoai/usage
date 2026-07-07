// Copyright (c) 2026 Hanzo AI Inc. MIT License.
import { describe, expect, it } from 'vitest'
import type { ProviderDescriptor } from '../src/provider.js'
import type { UsageSnapshot } from '../src/types.js'
import { UsageStore } from '../src/store.js'
import { mockHost } from './mock-host.js'

const snapshot = (providerId: string, usedPercent: number): UsageSnapshot => ({
  providerId,
  primary: { usedPercent, windowMinutes: 300 },
  dataConfidence: 'percentOnly',
  updatedAt: '2026-07-07T12:00:00.000Z',
})

const stub = (id: string, fetches: Array<UsageSnapshot | Error>): ProviderDescriptor => {
  let call = 0
  return {
    id,
    metadata: { displayName: id, sessionLabel: 'Session', weeklyLabel: 'Weekly' },
    strategies: () => [
      {
        id: `${id}.stub`,
        kind: 'localProbe',
        isAvailable: async () => true,
        fetch: async () => {
          const next = fetches[Math.min(call++, fetches.length - 1)]!
          if (next instanceof Error) throw next
          return {
            usage: next,
            sourceLabel: 'stub',
            strategyId: `${id}.stub`,
            strategyKind: 'localProbe' as const,
          }
        },
      },
    ],
  }
}

describe('UsageStore', () => {
  it('refreshes all providers concurrently and notifies subscribers', async () => {
    const host = mockHost()
    const store = new UsageStore({
      host,
      providers: [stub('a', [snapshot('a', 10)]), stub('b', [snapshot('b', 20)])],
    })
    let notifications = 0
    store.subscribe(() => notifications++)
    await store.refresh()
    const state = store.getState()
    expect(state.providers.a?.snapshot?.primary?.usedPercent).toBe(10)
    expect(state.providers.b?.snapshot?.primary?.usedPercent).toBe(20)
    expect(state.lastRefreshAt).toBeTruthy()
    expect(notifications).toBeGreaterThan(0)
  })

  it('keeps stale data when a refresh fails', async () => {
    const store = new UsageStore({
      host: mockHost(),
      providers: [stub('a', [snapshot('a', 10), new Error('boom')])],
    })
    await store.refresh()
    await store.refresh()
    const state = store.getState().providers.a!
    expect(state.snapshot?.primary?.usedPercent).toBe(10)
    expect(state.error).toBe('boom')
  })

  it('captures utilization history and persists schema v1 files', async () => {
    const host = mockHost()
    const store = new UsageStore({
      host,
      providers: [stub('a', [snapshot('a', 33)])],
      historyDir: '/data/history',
    })
    await store.refresh()
    expect(store.getHistory('a')[0]).toMatchObject({
      name: 'session',
      windowMinutes: 300,
      entries: [{ usedPercent: 33 }],
    })
    const persisted = JSON.parse(host.files.get('/data/history/a.json')!)
    expect(persisted.version).toBe(1)
    expect(persisted.unscoped[0].entries).toHaveLength(1)
  })
})
