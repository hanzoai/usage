// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Deepgram provider — port of CodexBarCore/Providers/Deepgram. Deepgram exposes a
// usage-breakdown API (audio hours, tokens, requests), no balance/quota. When no
// project is configured we enumerate projects and aggregate. Auth is the Deepgram
// `Token <key>` scheme (NOT Bearer).

import type {
  ProviderDescriptor,
  ProviderFetchContext,
  ProviderFetchResult,
  ProviderFetchStrategy,
} from '../provider.js'
import { forMode } from '../provider.js'
import type { UsageSnapshot } from '../types.js'
import { resolveApiKey } from './api-token.js'

const ENV_KEYS = ['DEEPGRAM_API_KEY']
const ENV_URL = 'DEEPGRAM_API_URL'
const ENV_PROJECT = 'DEEPGRAM_PROJECT_ID'
const DEFAULT_BASE = 'https://api.deepgram.com/v1'

interface UsageResult {
  requests?: number
  total_hours?: number
  tokens_in?: number
  tokens_out?: number
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

const deepgramStrategy: ProviderFetchStrategy = {
  id: 'deepgram.apiToken',
  kind: 'apiToken',
  async isAvailable(ctx) {
    return Boolean(resolveApiKey(ctx, ENV_KEYS))
  },
  async fetch(ctx: ProviderFetchContext): Promise<ProviderFetchResult> {
    const key = resolveApiKey(ctx, ENV_KEYS)
    if (!key) throw new Error('deepgram: no API key')
    const base = ctx.settings?.baseUrl ?? ctx.host.env(ENV_URL) ?? DEFAULT_BASE
    const headers = { Authorization: `Token ${key}`, Accept: 'application/json' }
    const get = async (path: string): Promise<Record<string, unknown>> => {
      const res = await ctx.host.http({ url: `${base}${path}`, headers, timeoutMs: 30_000 })
      if (res.status !== 200) throw new Error(`deepgram ${path} HTTP ${res.status}`)
      return JSON.parse(res.text) as Record<string, unknown>
    }
    const configured =
      (typeof ctx.settings?.projectId === 'string' ? ctx.settings.projectId : undefined) ??
      ctx.host.env(ENV_PROJECT)
    let projectIds: string[]
    if (configured) {
      projectIds = [configured]
    } else {
      const body = await get('/projects')
      const projects = Array.isArray(body.projects) ? body.projects : []
      projectIds = projects
        .map((p) => (p as { project_id?: string }).project_id)
        .filter((id): id is string => Boolean(id))
    }
    let hours = 0
    let tokens = 0
    let requests = 0
    for (const id of projectIds) {
      const body = await get(`/projects/${id}/usage/breakdown`)
      for (const r of (Array.isArray(body.results) ? body.results : []) as UsageResult[]) {
        hours += num(r.total_hours)
        tokens += num(r.tokens_in) + num(r.tokens_out)
        requests += num(r.requests)
      }
    }
    const now = ctx.host.now().toISOString()
    const usage: UsageSnapshot = {
      providerId: 'deepgram',
      identity: {
        providerId: 'deepgram',
        loginMethod: 'api',
        accountOrganization: projectIds.length === 1 ? projectIds[0] : `${projectIds.length} projects`,
      },
      totals: { tokens, requests },
      dataConfidence: tokens > 0 || requests > 0 || hours > 0 ? 'exact' : 'unknown',
      updatedAt: now,
    }
    return { usage, sourceLabel: 'Deepgram usage', strategyId: this.id, strategyKind: this.kind }
  },
  shouldFallback() {
    return false
  },
}

export const deepgramProvider: ProviderDescriptor = {
  id: 'deepgram',
  metadata: {
    displayName: 'Deepgram',
    sessionLabel: 'Usage',
    weeklyLabel: 'Requests',
    dashboardUrl: 'https://console.deepgram.com/usage',
    color: '#13ef93',
  },
  strategies: (mode) => forMode([deepgramStrategy], mode),
}
