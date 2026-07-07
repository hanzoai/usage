// Copyright (c) 2026 Hanzo AI Inc. MIT License.
import { describe, expect, it } from 'vitest'
import { codexProvider } from '../src/providers/codex.js'
import { claudeProvider } from '../src/providers/claude.js'
import { hanzoProvider } from '../src/providers/hanzo.js'
import { runPipeline } from '../src/provider.js'
import { json, mockHost } from './mock-host.js'

describe('codex provider', () => {
  it('maps the wham/usage response from ~/.codex/auth.json credentials', async () => {
    const host = mockHost({
      files: {
        '/home/z/.codex/auth.json': JSON.stringify({
          tokens: { access_token: 'tok', account_id: 'acct-1' },
        }),
      },
      responses: {
        'https://chatgpt.com/backend-api/wham/usage': json({
          plan_type: 'pro',
          rate_limit: {
            primary_window: { used_percent: 42, reset_at: 1751900000, limit_window_seconds: 18000 },
            secondary_window: { used_percent: 13, reset_at: 1752300000, limit_window_seconds: 604800 },
          },
          credits: { has_credits: true, balance: 250 },
          additional_rate_limits: [
            {
              limit_name: 'gpt-5.3-codex-spark',
              rate_limit: { primary_window: { used_percent: 7, limit_window_seconds: 18000 } },
            },
          ],
        }),
      },
    })
    const outcome = await runPipeline(codexProvider, { host, sourceMode: 'auto' })
    expect(outcome.error).toBeUndefined()
    const { usage, credits } = outcome.result!
    expect(usage.primary).toMatchObject({ usedPercent: 42, windowMinutes: 300 })
    expect(usage.secondary).toMatchObject({ usedPercent: 13, windowMinutes: 10080 })
    expect(usage.extraRateWindows).toHaveLength(1)
    expect(usage.identity?.plan).toBe('pro')
    expect(credits?.remaining).toBe(250)
    expect(host.requests[0]?.headers?.['ChatGPT-Account-Id']).toBe('acct-1')
  })

  it('skips when no credentials exist', async () => {
    const outcome = await runPipeline(codexProvider, { host: mockHost(), sourceMode: 'auto' })
    expect(outcome.result).toBeUndefined()
    expect(outcome.attempts).toMatchObject([{ strategyId: 'codex.oauth', skipped: true }])
  })

  it('honors CODEX_HOME', async () => {
    const host = mockHost({
      env: { CODEX_HOME: '/opt/codex' },
      files: { '/opt/codex/auth.json': JSON.stringify({ tokens: { access_token: 't' } }) },
      responses: {
        'https://chatgpt.com/backend-api/wham/usage': json({
          rate_limit: { primary_window: { used_percent: 1 } },
        }),
      },
    })
    const outcome = await runPipeline(codexProvider, { host, sourceMode: 'auto' })
    expect(outcome.result?.usage.primary?.usedPercent).toBe(1)
  })
})

describe('claude provider', () => {
  it('maps the OAuth usage response with model lanes and extra usage', async () => {
    const host = mockHost({
      files: {
        '/home/z/.claude/.credentials.json': JSON.stringify({
          claudeAiOauth: { accessToken: 'sk-ant-oat', subscriptionType: 'max' },
        }),
      },
      responses: {
        'https://api.anthropic.com/api/oauth/usage': json({
          five_hour: { utilization: 37, resets_at: '2026-07-07T15:00:00Z' },
          seven_day: { utilization: 61, resets_at: '2026-07-10T00:00:00Z' },
          seven_day_opus: { utilization: 80 },
          extra_usage: { used_cents: 1234, limit_cents: 5000 },
        }),
      },
    })
    const outcome = await runPipeline(claudeProvider, { host, sourceMode: 'auto' })
    const usage = outcome.result!.usage
    expect(usage.primary).toMatchObject({ usedPercent: 37, windowMinutes: 300 })
    expect(usage.secondary).toMatchObject({ usedPercent: 61, windowMinutes: 10080 })
    expect(usage.extraRateWindows?.[0]).toMatchObject({ id: 'seven_day_opus' })
    expect(usage.providerCost).toMatchObject({ used: 12.34, limit: 50 })
    expect(usage.identity?.plan).toBe('max')
    expect(host.requests[0]?.headers?.['anthropic-beta']).toBe('oauth-2025-04-20')
  })

  it('falls back to the claude.ai web session when OAuth is absent', async () => {
    const host = mockHost({
      responses: {
        'https://claude.ai/api/organizations': json([{ uuid: 'org-1' }]),
        'https://claude.ai/api/organizations/org-1/usage': json({
          five_hour: { utilization: 5 },
        }),
      },
    })
    const outcome = await runPipeline(claudeProvider, {
      host,
      sourceMode: 'auto',
      settings: { cookieHeader: 'sessionKey=sk-ant-sid' },
    })
    expect(outcome.result?.usage.primary?.usedPercent).toBe(5)
    expect(outcome.result?.strategyId).toBe('claude.web')
  })
})

describe('hanzo provider', () => {
  it('rolls up the commerce billing ledger', async () => {
    const host = mockHost({
      responses: {
        'https://api.hanzo.ai/v1/billing/usage': json({
          usage: [
            { total_tokens: 1000, spend_cents: 25, requests: 4 },
            { total_tokens: 500, spend_cents: 10, requests: 1 },
          ],
        }),
      },
    })
    const outcome = await runPipeline(hanzoProvider, {
      host,
      sourceMode: 'auto',
      settings: { apiKey: 'hz-key' },
    })
    const usage = outcome.result!.usage
    expect(usage.totals).toMatchObject({ tokens: 1500, requests: 5 })
    expect(usage.providerCost?.used).toBeCloseTo(0.35)
    expect(host.requests[0]?.headers?.Authorization).toBe('Bearer hz-key')
  })

  it('probes the newest dev CLI rollout for token counts and rate limits', async () => {
    const rollout = [
      JSON.stringify({ timestamp: 't0', type: 'session_meta', payload: {} }),
      JSON.stringify({
        timestamp: 't1',
        type: 'event_msg',
        payload: {
          type: 'token_count',
          info: { total_token_usage: { input_tokens: 900, output_tokens: 100, total_tokens: 1000 } },
          rate_limits: {
            primary: { used_percent: 21, window_minutes: 300, resets_in_seconds: 3600 },
            secondary: { used_percent: 55, window_minutes: 10080 },
          },
        },
      }),
    ].join('\n')
    const host = mockHost({
      files: {
        '/home/z/.codex/sessions/2026/07/06/rollout-old.jsonl': '{}',
        '/home/z/.codex/sessions/2026/07/07/rollout-2026-07-07T11-59-00-abc.jsonl': rollout,
      },
    })
    const outcome = await runPipeline(hanzoProvider, { host, sourceMode: 'auto' })
    const usage = outcome.result!.usage
    expect(outcome.result?.strategyId).toBe('hanzo.dev')
    expect(usage.primary).toMatchObject({ usedPercent: 21, windowMinutes: 300 })
    expect(usage.primary?.resetsAt).toBe('2026-07-07T13:00:00.000Z')
    expect(usage.secondary?.usedPercent).toBe(55)
    expect(usage.totals?.tokens).toBe(1000)
  })
})
