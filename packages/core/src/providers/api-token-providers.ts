// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// API-key providers built on the makeApiTokenProvider factory. Each descriptor is
// ~30 lines of data: how to build the request (endpoint + auth header) and how to
// map the JSON body. Every endpoint/shape here is a faithful port of the matching
// CodexBarCore/Providers/<Id> Swift source (verified, not guessed).

import type { ProviderDescriptor } from '../provider.js'
import type { RateWindow } from '../types.js'
import { makeApiTokenProvider, bearer, numberOrUndefined } from './api-token.js'

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
/** Parse a value that a provider may encode as number OR numeric string. */
const loose = (v: unknown): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}
const pct = (used: number, limit: number): number =>
  limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})

// ---- OpenRouter — GET {base}/credits (Bearer). data.total_credits/total_usage. ----

export const openrouterProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'openrouter',
  metadata: {
    displayName: 'OpenRouter',
    sessionLabel: 'Credits used',
    weeklyLabel: 'Credit limit',
    supportsCredits: true,
    dashboardUrl: 'https://openrouter.ai/settings/credits',
    color: '#6467f2',
  },
  envKeys: ['OPENROUTER_API_KEY'],
  request: (s, ctx) => ({
    url: `${s.baseUrl ?? ctx.host.env('OPENROUTER_API_URL') ?? 'https://openrouter.ai/api/v1'}/credits`,
    headers: bearer(s.apiKey!),
  }),
  map: (json, now) => {
    const d = obj(obj(json).data)
    const total = num(d.total_credits)
    const used = num(d.total_usage)
    return {
      usage: {
        identity: { providerId: 'openrouter', loginMethod: 'api' },
        providerCost: { used, limit: total, currencyCode: 'USD', period: 'total', updatedAt: now.toISOString() },
        dataConfidence: 'exact',
      },
      credits: { remaining: Math.max(0, total - used) },
    }
  },
})

// ---- DeepSeek — GET /user/balance (Bearer). balance_infos[].total_balance (string). ----

export const deepseekProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'deepseek',
  metadata: {
    displayName: 'DeepSeek',
    sessionLabel: 'Balance',
    weeklyLabel: 'Balance',
    supportsCredits: true,
    dashboardUrl: 'https://platform.deepseek.com/usage',
    color: '#527df0',
  },
  envKeys: ['DEEPSEEK_API_KEY', 'DEEPSEEK_KEY'],
  request: (s) => ({ url: 'https://api.deepseek.com/user/balance', headers: bearer(s.apiKey!) }),
  map: (json) => {
    const infos = (Array.isArray(obj(json).balance_infos) ? obj(json).balance_infos : []) as Array<
      Record<string, unknown>
    >
    const bal = (r: Record<string, unknown>): number => loose(r.total_balance) ?? 0
    const row =
      infos.find((r) => r.currency === 'USD' && bal(r) > 0) ??
      infos.find((r) => bal(r) > 0) ??
      infos.find((r) => r.currency === 'USD') ??
      infos[0]
    return {
      usage: {
        identity: { providerId: 'deepseek', loginMethod: 'api', plan: typeof row?.currency === 'string' ? row.currency : undefined },
        dataConfidence: 'exact',
      },
      credits: { remaining: row ? bal(row) : 0 },
    }
  },
})

// ---- ElevenLabs — GET /v1/user/subscription (xi-api-key). character_count/limit. ----

export const elevenlabsProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'elevenlabs',
  metadata: {
    displayName: 'ElevenLabs',
    sessionLabel: 'Characters',
    weeklyLabel: 'Character limit',
    dashboardUrl: 'https://elevenlabs.io/app/subscription',
    color: '#ebebe6',
  },
  envKeys: ['ELEVENLABS_API_KEY', 'XI_API_KEY'],
  request: (s, ctx) => ({
    url: `${s.baseUrl ?? ctx.host.env('ELEVENLABS_API_URL') ?? 'https://api.elevenlabs.io'}/v1/user/subscription`,
    headers: { 'xi-api-key': s.apiKey!, Accept: 'application/json' },
  }),
  map: (json, now) => {
    const b = obj(json)
    const count = num(b.character_count)
    const limit = num(b.character_limit)
    const resetUnix = numberOrUndefined(b.next_character_count_reset_unix)
    const resetsAt = resetUnix !== undefined ? new Date(resetUnix * 1000).toISOString() : undefined
    const overage = obj(b.current_overage)
    const overageAmount = loose(overage.amount)
    return {
      usage: {
        primary: { usedPercent: pct(count, limit), resetsAt },
        identity: { providerId: 'elevenlabs', loginMethod: 'api', plan: typeof b.tier === 'string' ? b.tier : undefined },
        subscriptionRenewsAt: resetsAt,
        providerCost:
          overageAmount !== undefined && overageAmount > 0
            ? {
                used: overageAmount,
                currencyCode: typeof overage.currency === 'string' ? overage.currency : 'USD',
                period: 'overage',
                updatedAt: now.toISOString(),
              }
            : undefined,
        dataConfidence: 'exact',
      },
    }
  },
})

// ---- Poe — GET /usage/current_balance (Bearer). current_point_balance (points). ----

export const poeProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'poe',
  metadata: {
    displayName: 'Poe',
    sessionLabel: 'Points',
    weeklyLabel: 'Points',
    supportsCredits: true,
    dashboardUrl: 'https://poe.com/api/keys',
    color: '#5d5cde',
  },
  envKeys: ['POE_API_KEY'],
  request: (s) => ({ url: 'https://api.poe.com/usage/current_balance', headers: bearer(s.apiKey!) }),
  map: (json) => ({
    usage: { identity: { providerId: 'poe', loginMethod: 'api' }, dataConfidence: 'exact' },
    credits: { remaining: num(obj(json).current_point_balance) },
  }),
})

// ---- Venice — GET /api/v1/billing/balance (Bearer). balances.usd/diem + alloc. ----

export const veniceProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'venice',
  metadata: {
    displayName: 'Venice',
    sessionLabel: 'Balance',
    weeklyLabel: 'DIEM allocation',
    supportsCredits: true,
    dashboardUrl: 'https://venice.ai/settings/api',
    color: '#3399ff',
  },
  envKeys: ['VENICE_API_KEY', 'VENICE_KEY'],
  request: (s) => ({ url: 'https://api.venice.ai/api/v1/billing/balance', headers: bearer(s.apiKey!) }),
  map: (json) => {
    const b = obj(json)
    const balances = obj(b.balances)
    const canConsume = b.canConsume !== false
    const currency = (typeof b.consumptionCurrency === 'string' ? b.consumptionCurrency : 'USD').toUpperCase()
    const usd = loose(balances.usd)
    const diem = loose(balances.diem)
    const alloc = loose(b.diemEpochAllocation)
    const isDiem = currency === 'DIEM'
    const remaining = (isDiem ? diem : usd) ?? 0
    let usedPercent = 0
    if (!canConsume) usedPercent = 100
    else if (isDiem && alloc && alloc > 0) usedPercent = pct(Math.max(0, alloc - remaining), alloc)
    return {
      usage: {
        primary: { usedPercent },
        identity: { providerId: 'venice', loginMethod: 'api', plan: currency },
        dataConfidence: 'exact',
      },
      credits: { remaining },
    }
  },
})

// ---- Chutes — GET /users/me/subscription_usage (Bearer). rolling(4h)+monthly. ----

/** Read a used/limit/remaining/percent meter from a key-tolerant window object. */
const chutesWindow = (container: unknown, windowMinutes: number): RateWindow | undefined => {
  const w = obj(container)
  const pick = (keys: string[]): number | undefined => {
    for (const k of keys) {
      const v = loose(w[k])
      if (v !== undefined) return v
    }
    return undefined
  }
  const explicit = pick(['percent_used', 'usage_percent', 'used_percent', 'utilization', 'utilization_percent'])
  const remainingPct = pick(['percent_remaining', 'remaining_percent'])
  const used = pick(['used', 'usage', 'consumed', 'current', 'requests', 'tokens', 'monthly_usage'])
  const limit = pick(['limit', 'cap', 'max', 'maximum', 'quota', 'quota_limit', 'monthly_limit', 'total'])
  const remaining = pick(['remaining', 'available', 'balance', 'left'])
  let usedPercent: number | undefined = explicit
  if (usedPercent === undefined && remainingPct !== undefined) usedPercent = 100 - remainingPct
  if (usedPercent !== undefined && usedPercent <= 1 && usedPercent >= 0) usedPercent *= 100
  if (usedPercent === undefined && limit !== undefined) {
    const u = used ?? (remaining !== undefined ? limit - remaining : undefined)
    if (u !== undefined) usedPercent = pct(u, limit)
  }
  if (usedPercent === undefined) return undefined
  const resetRaw = pick(['reset_at', 'resets_at', 'next_reset_at', 'period_end', 'current_period_end', 'expires_at', 'window_end'])
  return {
    usedPercent: Math.min(100, Math.max(0, usedPercent)),
    windowMinutes,
    resetsAt: resetRaw !== undefined ? new Date(resetRaw * 1000).toISOString() : undefined,
  }
}

export const chutesProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'chutes',
  metadata: {
    displayName: 'Chutes',
    sessionLabel: '4h quota',
    weeklyLabel: 'Monthly quota',
    dashboardUrl: 'https://chutes.ai',
    color: '#eab308',
  },
  envKeys: ['CHUTES_API_KEY'],
  request: (s, ctx) => ({
    url: `${s.baseUrl ?? ctx.host.env('CHUTES_API_URL') ?? 'https://api.chutes.ai'}/users/me/subscription_usage`,
    headers: bearer(s.apiKey!),
  }),
  map: (json) => {
    const b = obj(json)
    const rolling =
      chutesWindow(b.rolling, 240) ??
      chutesWindow(b.rolling_window, 240) ??
      chutesWindow(b.four_hour, 240)
    const monthly =
      chutesWindow(b.monthly, 43_200) ??
      chutesWindow(b.subscription, 43_200) ??
      chutesWindow(b.subscription_usage, 43_200)
    const plan = b.plan_name ?? b.plan ?? b.tier
    return {
      usage: {
        primary: rolling,
        secondary: monthly,
        identity: { providerId: 'chutes', loginMethod: 'api', plan: typeof plan === 'string' ? plan : undefined },
        dataConfidence: rolling || monthly ? 'percentOnly' : 'unknown',
      },
    }
  },
})

// ---- Moonshot (Kimi API) — GET {base}/v1/users/me/balance (Bearer). ----

const moonshotBase = (region: unknown): string =>
  region === 'china' ? 'https://api.moonshot.cn' : 'https://api.moonshot.ai'

export const moonshotProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'moonshot',
  metadata: {
    displayName: 'Moonshot',
    sessionLabel: 'Balance',
    weeklyLabel: 'Balance',
    supportsCredits: true,
    dashboardUrl: 'https://platform.moonshot.ai/console/info',
    color: '#16a34a',
  },
  envKeys: ['MOONSHOT_API_KEY', 'MOONSHOT_KEY'],
  request: (s, ctx) => ({
    url: `${s.baseUrl ?? moonshotBase(s.region ?? ctx.host.env('MOONSHOT_REGION'))}/v1/users/me/balance`,
    headers: bearer(s.apiKey!),
  }),
  map: (json) => {
    const d = obj(obj(json).data)
    return {
      usage: { identity: { providerId: 'moonshot', loginMethod: 'api' }, dataConfidence: 'exact' },
      credits: { remaining: num(d.available_balance) },
    }
  },
})

// ---- Kimi (coding API key path) — GET {base}/coding/v1/usages (Bearer). ----

export const kimiProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'kimi',
  metadata: {
    displayName: 'Kimi',
    sessionLabel: 'Weekly',
    weeklyLabel: 'Rate (5h)',
    dashboardUrl: 'https://www.kimi.com/code/console',
    color: '#111111',
  },
  envKeys: ['KIMI_CODE_API_KEY'],
  request: (s, ctx) => ({
    url: `${s.baseUrl ?? ctx.host.env('KIMI_CODE_BASE_URL') ?? 'https://api.kimi.com'}/coding/v1/usages`,
    headers: bearer(s.apiKey!),
  }),
  map: (json) => {
    const b = obj(json)
    const detail = obj(b.usage)
    const limit = loose(detail.limit) ?? 0
    const used = loose(detail.used) ?? (limit && loose(detail.remaining) !== undefined ? limit - loose(detail.remaining)! : 0)
    const resetTime = detail.resetTime ?? detail.resetAt ?? detail.reset_time
    const rate = obj(obj((Array.isArray(b.limits) ? b.limits[0] : undefined)).detail)
    const rateLimit = loose(rate.limit)
    const rateUsed = loose(rate.used)
    const secondary: RateWindow | undefined =
      rateLimit !== undefined ? { usedPercent: pct(rateUsed ?? 0, rateLimit), windowMinutes: 300 } : undefined
    return {
      usage: {
        primary: { usedPercent: pct(used, limit), resetsAt: typeof resetTime === 'string' ? resetTime : undefined },
        secondary,
        identity: { providerId: 'kimi', loginMethod: 'api' },
        dataConfidence: 'percentOnly',
      },
    }
  },
})

// ---- Kimi K2 (legacy kimi-k2.ai) — GET /api/user/credits (Bearer). ----

export const kimik2Provider: ProviderDescriptor = makeApiTokenProvider({
  id: 'kimik2',
  metadata: {
    displayName: 'Kimi K2',
    sessionLabel: 'Credits',
    weeklyLabel: 'Credits',
    supportsCredits: true,
    dashboardUrl: 'https://kimi-k2.ai',
    color: '#111111',
  },
  envKeys: ['KIMI_K2_API_KEY', 'KIMI_API_KEY', 'KIMI_KEY'],
  request: (s) => ({ url: 'https://kimi-k2.ai/api/user/credits', headers: bearer(s.apiKey!) }),
  map: (json) => {
    const b = obj(json)
    const nested = { ...obj(b.data), ...obj(b.result), ...obj(b.usage), ...obj(b.credits) }
    const pick = (keys: string[]): number | undefined => {
      for (const k of keys) {
        const v = loose(b[k]) ?? loose(nested[k])
        if (v !== undefined) return v
      }
      return undefined
    }
    const remaining =
      pick([
        'credits_remaining',
        'creditsRemaining',
        'remaining_credits',
        'remainingCredits',
        'available_credits',
        'availableCredits',
        'credits_left',
        'creditsLeft',
        'remaining',
      ]) ?? 0
    return {
      usage: { identity: { providerId: 'kimik2', loginMethod: 'api' }, dataConfidence: 'exact' },
      credits: { remaining },
    }
  },
})

// ---- Zai (z.ai) — GET {base}/api/monitor/usage/quota/limit (Bearer). ----

const zaiBase = (region: unknown): string =>
  region === 'bigmodel-cn' ? 'https://open.bigmodel.cn' : 'https://api.z.ai'

const ZAI_UNIT_MINUTES: Record<number, number> = { 1: 1440, 3: 60, 5: 1, 6: 10_080 }

const zaiWindow = (raw: Record<string, unknown>): RateWindow => {
  const limit = loose(raw.usage) ?? 0
  const current = loose(raw.currentValue)
  const remaining = loose(raw.remaining)
  const used = current ?? (remaining !== undefined ? Math.max(0, limit - remaining) : undefined)
  const explicit = loose(raw.percentage)
  const usedPercent = used !== undefined && limit > 0 ? pct(used, limit) : explicit ?? 0
  const unit = loose(raw.unit)
  const number = loose(raw.number)
  const resetMs = loose(raw.nextResetTime)
  return {
    usedPercent,
    windowMinutes: unit !== undefined && number !== undefined ? (ZAI_UNIT_MINUTES[unit] ?? 0) * number : undefined,
    resetsAt: resetMs !== undefined ? new Date(resetMs).toISOString() : undefined,
  }
}

export const zaiProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'zai',
  metadata: {
    displayName: 'z.ai',
    sessionLabel: 'Token quota',
    weeklyLabel: 'Time quota',
    dashboardUrl: 'https://z.ai/manage-apikey/coding-plan/personal/my-plan',
    color: '#3b82f6',
  },
  envKeys: ['Z_AI_API_KEY'],
  baseUrlEnv: ['Z_AI_API_HOST'],
  request: (s, ctx) => ({
    url: `${resolveZaiBase(s, ctx.host.env('Z_AI_API_HOST'))}/api/monitor/usage/quota/limit`,
    headers: { ...bearer(s.apiKey!), accept: 'application/json' },
  }),
  map: (json) => {
    const data = obj(obj(json).data)
    const limits = (Array.isArray(data.limits) ? data.limits : []) as Array<Record<string, unknown>>
    const tokens = limits.filter((l) => l.type === 'TOKENS_LIMIT').map(zaiWindow)
    const time = limits.find((l) => l.type === 'TIME_LIMIT')
    const plan = data.planName ?? data.plan ?? data.planType ?? data.packageName
    return {
      usage: {
        primary: tokens[0],
        secondary: time ? zaiWindow(time) : undefined,
        tertiary: tokens[1],
        identity: { providerId: 'zai', loginMethod: 'api', plan: typeof plan === 'string' ? plan : undefined },
        dataConfidence: tokens.length || time ? 'percentOnly' : 'unknown',
      },
    }
  },
})

const resolveZaiBase = (s: { baseUrl?: string; region?: unknown }, hostEnv?: string): string =>
  s.baseUrl ?? hostEnv ?? zaiBase(s.region)

// ---- OpenAI (platform) — GET /v1/dashboard/billing/credit_grants (Bearer). ----

export const openaiProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'openai',
  metadata: {
    displayName: 'OpenAI',
    sessionLabel: 'Credits used',
    weeklyLabel: 'Credit grant',
    supportsCredits: true,
    dashboardUrl: 'https://platform.openai.com/usage',
    statusPageUrl: 'https://status.openai.com',
    color: '#0f826e',
  },
  envKeys: ['OPENAI_ADMIN_KEY', 'OPENAI_API_KEY'],
  request: (s) => ({
    url: 'https://api.openai.com/v1/dashboard/billing/credit_grants',
    headers: bearer(s.apiKey!),
  }),
  map: (json, now) => {
    const b = obj(json)
    const granted = num(b.total_granted)
    const used = num(b.total_used)
    const available = num(b.total_available)
    return {
      usage: {
        primary: { usedPercent: pct(used, granted) },
        identity: { providerId: 'openai', loginMethod: 'api' },
        providerCost: { used, limit: granted, currencyCode: 'USD', period: 'grant', updatedAt: now.toISOString() },
        dataConfidence: 'exact',
      },
      credits: { remaining: available },
    }
  },
})

// ---- LiteLLM (self-hosted) — GET {base}/key/info (Bearer). info.spend/expires. ----

const stripV1 = (base: string): string => base.replace(/\/v1\/?$/, '')

export const litellmProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'litellm',
  metadata: {
    displayName: 'LiteLLM',
    sessionLabel: 'Key spend',
    weeklyLabel: 'Budget',
    dashboardUrl: 'https://docs.litellm.ai/docs/proxy/cost_tracking',
    color: '#22c55e',
  },
  envKeys: ['LITELLM_API_KEY'],
  baseUrlEnv: ['LITELLM_BASE_URL'],
  requireBaseUrl: true,
  request: (s) => ({ url: `${stripV1(s.baseUrl!)}/key/info`, headers: bearer(s.apiKey!) }),
  map: (json, now) => {
    const info = obj(obj(json).info)
    const spend = num(info.spend)
    return {
      usage: {
        identity: {
          providerId: 'litellm',
          loginMethod: 'api',
          accountOrganization: typeof info.team_id === 'string' ? info.team_id : undefined,
          accountEmail: typeof info.user_id === 'string' ? info.user_id : undefined,
          plan: typeof info.key_name === 'string' ? info.key_name : undefined,
        },
        providerCost: { used: spend, currencyCode: 'USD', period: 'key', updatedAt: now.toISOString() },
        subscriptionExpiresAt: typeof info.expires === 'string' ? info.expires : undefined,
        dataConfidence: 'exact',
      },
    }
  },
})

// ---- LLMProxy (self-hosted) — GET {base}/v1/quota-stats (Bearer). ----

const llmProxyV1 = (base: string): string => (/\/v1\/?$/.test(base) ? base.replace(/\/$/, '') : `${base.replace(/\/$/, '')}/v1`)

export const llmproxyProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'llmproxy',
  metadata: {
    displayName: 'LLM Proxy',
    sessionLabel: 'Quota used',
    weeklyLabel: 'Approx. spend',
    dashboardUrl: 'https://github.com/hzruo/LLM-API-Key-Proxy',
    color: '#8b5cf6',
  },
  envKeys: ['LLM_PROXY_API_KEY'],
  baseUrlEnv: ['LLM_PROXY_BASE_URL'],
  requireBaseUrl: true,
  request: (s) => ({ url: `${llmProxyV1(s.baseUrl!)}/quota-stats`, headers: bearer(s.apiKey!) }),
  map: (json, now) => {
    const b = obj(json)
    const providers = obj(b.providers)
    const summary = obj(b.summary)
    let minRemaining = 100
    let earliestReset: string | undefined
    let sumTokens = 0
    let sumRequests = 0
    let sumCost = 0
    for (const p of Object.values(providers)) {
      const stats = obj(p)
      sumRequests += num(stats.total_requests)
      sumCost += num(stats.approx_cost)
      const t = obj(stats.tokens)
      sumTokens += num(t.input_cached) + num(t.input_uncached) + num(t.output)
      const groups = Array.isArray(stats.quota_groups)
        ? (stats.quota_groups as unknown[])
        : Object.values(obj(stats.quota_groups))
      for (const g of groups) {
        const grp = obj(g)
        const rem = loose(grp.remaining_percent)
        if (rem !== undefined && rem < minRemaining) minRemaining = rem
        const reset = typeof grp.reset_time === 'string' ? grp.reset_time : undefined
        if (reset && (!earliestReset || reset < earliestReset)) earliestReset = reset
      }
    }
    const totalRequests = numberOrUndefined(summary.total_requests) ?? sumRequests
    const totalTokens = numberOrUndefined(summary.total_tokens) ?? sumTokens
    const approxCost = numberOrUndefined(summary.approx_cost) ?? sumCost
    return {
      usage: {
        primary: { usedPercent: Math.min(100, Math.max(0, 100 - minRemaining)), resetsAt: earliestReset },
        identity: { providerId: 'llmproxy', loginMethod: 'api' },
        totals: { tokens: totalTokens, requests: totalRequests },
        providerCost: approxCost > 0 ? { used: approxCost, currencyCode: 'USD', period: 'approx', updatedAt: now.toISOString() } : undefined,
        dataConfidence: 'exact',
      },
    }
  },
})

// ---- MiniMax (coding-plan API key path) — GET {apiBase}/v1/api/openplatform/coding_plan/remains. ----
// Standard (sk-api-*) keys need a browser cookie (connect-only); the coding-plan
// (sk-cp-*) key uses this API path. We map the interval/weekly windows honestly.

const minimaxApiBase = (region: unknown): string =>
  region === 'cn' || region === 'china' ? 'https://api.minimaxi.com' : 'https://api.minimax.io'

const minimaxWindow = (m: Record<string, unknown>, prefix: 'current_interval' | 'current_weekly', windowMinutes: number): RateWindow | undefined => {
  const remainingPct = loose(m[`${prefix}_remaining_percent`])
  const total = loose(m[`${prefix}_total_count`])
  const usedCount = loose(m[`${prefix}_usage_count`])
  let usedPercent: number | undefined
  if (remainingPct !== undefined) usedPercent = 100 - remainingPct
  else if (total !== undefined && usedCount !== undefined) usedPercent = pct(usedCount, total)
  if (usedPercent === undefined) return undefined
  return { usedPercent: Math.min(100, Math.max(0, usedPercent)), windowMinutes }
}

export const minimaxProvider: ProviderDescriptor = makeApiTokenProvider({
  id: 'minimax',
  metadata: {
    displayName: 'MiniMax',
    sessionLabel: 'Interval',
    weeklyLabel: 'Weekly',
    dashboardUrl: 'https://platform.minimax.io/user-center/payment/coding-plan',
    color: '#f43f5e',
  },
  envKeys: ['MINIMAX_CODING_API_KEY', 'MINIMAX_API_KEY'],
  request: (s, ctx) => ({
    url: `${s.baseUrl ?? minimaxApiBase(s.region ?? ctx.host.env('MINIMAX_REGION'))}/v1/api/openplatform/coding_plan/remains`,
    headers: { ...bearer(s.apiKey!), accept: 'application/json', 'MM-API-Source': 'HanzoUsage' },
  }),
  map: (json) => {
    const data = obj(obj(json).data)
    const models = (Array.isArray(data.model_remains) ? data.model_remains : []) as Array<Record<string, unknown>>
    const m = obj(models[0])
    const plan = data.plan_name ?? data.current_plan_title ?? data.current_subscribe_title
    const points = loose(data.points_balance) ?? loose(data.balance)
    return {
      usage: {
        primary: minimaxWindow(m, 'current_interval', 0),
        secondary: minimaxWindow(m, 'current_weekly', 10_080),
        identity: { providerId: 'minimax', loginMethod: 'api', plan: typeof plan === 'string' ? plan : undefined },
        dataConfidence: models.length ? 'percentOnly' : 'unknown',
      },
      credits: points !== undefined ? { remaining: points } : undefined,
    }
  },
})
