// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// TypeScript port of CodexBarCore's data model (UsageFetcher.swift, CreditsModels.swift,
// CostUsageModels.swift). Wire-compatible JSON where the Swift app persists snapshots.

/** Universal quota unit — one rate-limit window (session/5h, weekly, …). */
export interface RateWindow {
  /** 0–100 percent used. */
  usedPercent: number
  /** Window length in minutes (300 = 5h, 10080 = weekly). */
  windowMinutes?: number
  /** Absolute reset time, ISO 8601. */
  resetsAt?: string
  /** Textual reset description when only scraped text is available. */
  resetDescription?: string
  /** Rolling-recovery providers: percent that regenerates next. */
  nextRegenPercent?: number
  /** True when a lane was fabricated (e.g. provider returned null for it). */
  isSyntheticPlaceholder?: boolean
}

export const remainingPercent = (w: RateWindow): number =>
  Math.max(0, 100 - w.usedPercent)

export interface NamedRateWindow {
  id: string
  title: string
  window: RateWindow
  usageKnown: boolean
}

export type UsageDataConfidence = 'exact' | 'estimated' | 'percentOnly' | 'unknown'

export interface ProviderIdentity {
  providerId: string
  accountEmail?: string
  accountOrganization?: string
  loginMethod?: string
  plan?: string
}

/** Per-provider fetch result — the central value of the system. */
export interface UsageSnapshot {
  providerId: string
  /** Session / 5h lane. */
  primary?: RateWindow
  /** Weekly lane. */
  secondary?: RateWindow
  tertiary?: RateWindow
  /** Model-specific or auxiliary windows. */
  extraRateWindows?: NamedRateWindow[]
  identity?: ProviderIdentity
  dataConfidence: UsageDataConfidence
  subscriptionExpiresAt?: string
  subscriptionRenewsAt?: string
  providerCost?: ProviderCostSnapshot
  /** Absolute token totals when the source reports them (exact confidence). */
  totals?: UsageTotals
  updatedAt: string
}

export interface UsageTotals {
  tokens: number
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  requests?: number
}

export interface CreditEvent {
  id: string
  date: string
  service: string
  creditsUsed: number
}

export interface CreditsSnapshot {
  remaining: number
  unlimited?: boolean
  events?: CreditEvent[]
  updatedAt: string
}

/** Generic spend/budget meter used by API providers. */
export interface ProviderCostSnapshot {
  used: number
  limit?: number
  currencyCode: string
  period?: string
  resetsAt?: string
  updatedAt: string
}

// ---- Cost usage (offline JSONL session-log scanning, à la ccusage) ----

export interface ModelBreakdown {
  modelName: string
  costUSD: number
  totalTokens: number
  requestCount: number
}

export interface CostUsageDailyEntry {
  /** "YYYY-MM-DD" */
  date: string
  inputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  outputTokens: number
  totalTokens: number
  requestCount: number
  costUSD: number
  modelsUsed: string[]
  modelBreakdowns?: ModelBreakdown[]
}

export interface CostUsageTokenSnapshot {
  providerId: string
  sessionTokens: number
  sessionCostUSD: number
  sessionRequests: number
  last30DaysTokens: number
  last30DaysCostUSD: number
  last30DaysRequests: number
  currencyCode: string
  historyDays: number
  daily: CostUsageDailyEntry[]
  updatedAt: string
}

// ---- History (sparklines) — schema-compatible with PlanUtilizationHistoryStore v1 ----

export interface PlanUtilizationEntry {
  capturedAt: string
  usedPercent: number
  resetsAt?: string
}

export interface PlanUtilizationSeriesHistory {
  /** "session" | "weekly" | named lane */
  name: string
  windowMinutes: number
  entries: PlanUtilizationEntry[]
}

export interface PlanUtilizationHistoryFile {
  version: 1
  preferredAccountKey?: string
  unscoped: PlanUtilizationSeriesHistory[]
  accounts?: Record<string, PlanUtilizationSeriesHistory[]>
}

// ---- Provider status (statuspage.io etc.) ----

export type StatusIndicator = 'none' | 'minor' | 'major' | 'critical' | 'unknown'

export interface ProviderStatus {
  indicator: StatusIndicator
  description?: string
  updatedAt: string
}
