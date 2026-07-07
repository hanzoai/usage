// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Claude (Anthropic) provider — port of CodexBarCore/Providers/Claude.
// OAuth strategy reads Claude Code credentials (~/.claude/.credentials.json)
// and calls the Anthropic OAuth usage endpoint; web strategy uses a claude.ai
// sessionKey cookie supplied via settings.

import type {
  ProviderDescriptor,
  ProviderFetchContext,
  ProviderFetchResult,
  ProviderFetchStrategy,
} from '../provider.js'
import { forMode } from '../provider.js'
import type { NamedRateWindow, RateWindow, UsageSnapshot } from '../types.js'
import { readJsonFile } from '../host.js'

interface ClaudeCredentialsFile {
  claudeAiOauth?: {
    accessToken?: string
    expiresAt?: number
    subscriptionType?: string
  }
}

interface ClaudeUsageWindow {
  utilization?: number
  used_percent?: number
  resets_at?: string
}

interface ClaudeUsageResponse {
  five_hour?: ClaudeUsageWindow | null
  seven_day?: ClaudeUsageWindow | null
  seven_day_sonnet?: ClaudeUsageWindow | null
  seven_day_opus?: ClaudeUsageWindow | null
  extra_usage?: { used_cents?: number; limit_cents?: number } | null
  rate_limit_tier?: string
  subscriptionType?: string
}

const WINDOW_MINUTES: Record<string, number> = {
  five_hour: 300,
  seven_day: 10_080,
  seven_day_sonnet: 10_080,
  seven_day_opus: 10_080,
}

const toWindow = (key: string, w: ClaudeUsageWindow | null | undefined): RateWindow | undefined => {
  const used = w?.utilization ?? w?.used_percent
  if (typeof used !== 'number') return undefined
  return { usedPercent: used, windowMinutes: WINDOW_MINUTES[key], resetsAt: w?.resets_at }
}

const mapUsage = (
  body: ClaudeUsageResponse,
  now: string,
  loginMethod: string,
  plan?: string,
): UsageSnapshot => {
  const extras: NamedRateWindow[] = []
  for (const [key, title] of [
    ['seven_day_sonnet', 'Sonnet weekly'],
    ['seven_day_opus', 'Opus weekly'],
  ] as const) {
    const window = toWindow(key, body[key])
    if (window) extras.push({ id: key, title, window, usageKnown: true })
  }
  return {
    providerId: 'claude',
    primary: toWindow('five_hour', body.five_hour),
    secondary: toWindow('seven_day', body.seven_day),
    extraRateWindows: extras.length ? extras : undefined,
    identity: {
      providerId: 'claude',
      plan: plan ?? body.subscriptionType ?? body.rate_limit_tier,
      loginMethod,
    },
    providerCost:
      body.extra_usage && typeof body.extra_usage.used_cents === 'number'
        ? {
            used: body.extra_usage.used_cents / 100,
            limit:
              typeof body.extra_usage.limit_cents === 'number'
                ? body.extra_usage.limit_cents / 100
                : undefined,
            currencyCode: 'USD',
            period: 'monthly',
            updatedAt: now,
          }
        : undefined,
    dataConfidence: 'percentOnly',
    updatedAt: now,
  }
}

const credentialPaths = ['~/.claude/.credentials.json', '~/.config/claude/.credentials.json']

const readCredentials = async (ctx: ProviderFetchContext) => {
  for (const path of credentialPaths) {
    const file = await readJsonFile<ClaudeCredentialsFile>(ctx.host, path)
    if (file?.claudeAiOauth?.accessToken) return file.claudeAiOauth
  }
  return undefined
}

const oauthStrategy: ProviderFetchStrategy = {
  id: 'claude.oauth',
  kind: 'oauth',
  async isAvailable(ctx) {
    return Boolean(await readCredentials(ctx))
  },
  async fetch(ctx): Promise<ProviderFetchResult> {
    const creds = await readCredentials(ctx)
    if (!creds?.accessToken) throw new Error('claude: no OAuth credentials')
    const res = await ctx.host.http({
      url: 'https://api.anthropic.com/api/oauth/usage',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'anthropic-beta': 'oauth-2025-04-20',
        Accept: 'application/json',
      },
      timeoutMs: 30_000,
    })
    if (res.status !== 200) throw new Error(`claude usage HTTP ${res.status}`)
    const body = JSON.parse(res.text) as ClaudeUsageResponse
    return {
      usage: mapUsage(body, ctx.host.now().toISOString(), 'oauth', creds.subscriptionType),
      sourceLabel: 'Claude OAuth',
      strategyId: this.id,
      strategyKind: this.kind,
    }
  },
}

/** Web strategy: settings.cookieHeader must hold `sessionKey=sk-ant-…`. */
const webStrategy: ProviderFetchStrategy = {
  id: 'claude.web',
  kind: 'web',
  async isAvailable(ctx) {
    return typeof ctx.settings?.cookieHeader === 'string'
  },
  async fetch(ctx): Promise<ProviderFetchResult> {
    const cookie = String(ctx.settings?.cookieHeader)
    const get = async (path: string) => {
      const res = await ctx.host.http({
        url: `https://claude.ai/api${path}`,
        headers: { Cookie: cookie, Accept: 'application/json' },
        timeoutMs: 30_000,
      })
      if (res.status !== 200) throw new Error(`claude.ai${path} HTTP ${res.status}`)
      return JSON.parse(res.text)
    }
    const orgs = (await get('/organizations')) as Array<{ uuid: string }>
    const orgId = orgs[0]?.uuid
    if (!orgId) throw new Error('claude: no organization for session')
    const body = (await get(`/organizations/${orgId}/usage`)) as ClaudeUsageResponse
    return {
      usage: mapUsage(body, ctx.host.now().toISOString(), 'web'),
      sourceLabel: 'claude.ai session',
      strategyId: this.id,
      strategyKind: this.kind,
    }
  },
}

export const claudeProvider: ProviderDescriptor = {
  id: 'claude',
  metadata: {
    displayName: 'Claude',
    sessionLabel: 'Session (5h)',
    weeklyLabel: 'Weekly limit',
    defaultEnabled: true,
    dashboardUrl: 'https://claude.ai/settings/usage',
    statusPageUrl: 'https://status.anthropic.com',
    color: '#d97757',
  },
  strategies: (mode) => forMode([oauthStrategy, webStrategy], mode),
}
