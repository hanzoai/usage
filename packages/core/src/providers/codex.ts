// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Codex (OpenAI) provider — port of CodexBarCore/Providers/Codex (OAuth strategy).
// Reads CLI credentials from $CODEX_HOME/auth.json (default ~/.codex/auth.json)
// and calls the ChatGPT backend usage endpoint.

import type {
  ProviderDescriptor,
  ProviderFetchContext,
  ProviderFetchResult,
  ProviderFetchStrategy,
} from '../provider.js'
import { forMode } from '../provider.js'
import type { CreditsSnapshot, RateWindow, UsageSnapshot } from '../types.js'
import { expandHome, readJsonFile } from '../host.js'

interface CodexAuthFile {
  tokens?: {
    access_token?: string
    account_id?: string
  }
  OPENAI_API_KEY?: string
}

interface CodexWindow {
  used_percent?: number
  reset_at?: number
  limit_window_seconds?: number
}

interface CodexUsageResponse {
  plan_type?: string
  rate_limit?: {
    primary_window?: CodexWindow
    secondary_window?: CodexWindow
  }
  credits?: { has_credits?: boolean; unlimited?: boolean; balance?: number }
  additional_rate_limits?: Array<{
    limit_name?: string
    rate_limit?: { primary_window?: CodexWindow }
  }>
}

const codexHome = (ctx: ProviderFetchContext): string =>
  ctx.host.env('CODEX_HOME') ?? expandHome(ctx.host, '~/.codex')

const toWindow = (w: CodexWindow | undefined): RateWindow | undefined => {
  if (!w || typeof w.used_percent !== 'number') return undefined
  return {
    usedPercent: w.used_percent,
    windowMinutes: w.limit_window_seconds ? Math.round(w.limit_window_seconds / 60) : undefined,
    resetsAt: w.reset_at ? new Date(w.reset_at * 1000).toISOString() : undefined,
  }
}

const oauthStrategy: ProviderFetchStrategy = {
  id: 'codex.oauth',
  kind: 'oauth',
  async isAvailable(ctx) {
    const auth = await readJsonFile<CodexAuthFile>(ctx.host, `${codexHome(ctx)}/auth.json`)
    return Boolean(auth?.tokens?.access_token)
  },
  async fetch(ctx): Promise<ProviderFetchResult> {
    const auth = await readJsonFile<CodexAuthFile>(ctx.host, `${codexHome(ctx)}/auth.json`)
    const token = auth?.tokens?.access_token
    if (!token) throw new Error('codex: no access token in auth.json')
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'HanzoUsage',
    }
    if (auth?.tokens?.account_id) headers['ChatGPT-Account-Id'] = auth.tokens.account_id
    const res = await ctx.host.http({
      url: 'https://chatgpt.com/backend-api/wham/usage',
      headers,
      timeoutMs: 30_000,
    })
    if (res.status !== 200) throw new Error(`codex usage HTTP ${res.status}`)
    const body = JSON.parse(res.text) as CodexUsageResponse
    const now = ctx.host.now().toISOString()
    const usage: UsageSnapshot = {
      providerId: 'codex',
      primary: toWindow(body.rate_limit?.primary_window),
      secondary: toWindow(body.rate_limit?.secondary_window),
      extraRateWindows: (body.additional_rate_limits ?? [])
        .map((extra) => {
          const window = toWindow(extra.rate_limit?.primary_window)
          if (!window || !extra.limit_name) return undefined
          return { id: extra.limit_name, title: extra.limit_name, window, usageKnown: true }
        })
        .filter((w): w is NonNullable<typeof w> => Boolean(w)),
      identity: { providerId: 'codex', plan: body.plan_type, loginMethod: 'oauth' },
      dataConfidence: 'percentOnly',
      updatedAt: now,
    }
    let credits: CreditsSnapshot | undefined
    if (body.credits?.has_credits) {
      credits = {
        remaining: body.credits.balance ?? 0,
        unlimited: body.credits.unlimited,
        updatedAt: now,
      }
    }
    return {
      usage,
      credits,
      sourceLabel: 'OpenAI OAuth',
      strategyId: this.id,
      strategyKind: this.kind,
    }
  },
}

export const codexProvider: ProviderDescriptor = {
  id: 'codex',
  metadata: {
    displayName: 'Codex',
    sessionLabel: '5h limit',
    weeklyLabel: 'Weekly limit',
    supportsCredits: true,
    defaultEnabled: true,
    dashboardUrl: 'https://chatgpt.com/codex/settings/usage',
    statusPageUrl: 'https://status.openai.com',
    color: '#10a37f',
  },
  strategies: (mode) => forMode([oauthStrategy], mode),
}
