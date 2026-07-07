// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Provider abstraction — TypeScript port of CodexBarCore's ProviderDescriptor /
// ProviderFetchPlan / ProviderFetchPipeline (priority-ordered strategies with
// availability checks and fallback).

import type { CreditsSnapshot, UsageSnapshot } from './types.js'
import type { UsageHost } from './host.js'

export type ProviderSourceMode = 'auto' | 'web' | 'cli' | 'oauth' | 'api'
export type ProviderFetchKind = 'cli' | 'web' | 'oauth' | 'apiToken' | 'localProbe'

export interface ProviderSettings {
  /** API key / secret for apiToken strategies. */
  apiKey?: string
  /** Base URL override (e.g. self-hosted gateway). */
  baseUrl?: string
  /** Bearer-token resolver for cloud (IAM) strategies. */
  getToken?: () => Promise<string | undefined>
  /** Extra provider-specific settings. */
  [key: string]: unknown
}

export interface ProviderFetchContext {
  host: UsageHost
  sourceMode: ProviderSourceMode
  settings?: ProviderSettings
  verbose?: boolean
}

export interface ProviderFetchResult {
  usage: UsageSnapshot
  credits?: CreditsSnapshot
  /** Human-readable label of the source that produced the data. */
  sourceLabel: string
  strategyId: string
  strategyKind: ProviderFetchKind
}

export interface ProviderFetchStrategy {
  /** e.g. "codex.oauth", "claude.web" */
  id: string
  kind: ProviderFetchKind
  isAvailable(ctx: ProviderFetchContext): Promise<boolean>
  fetch(ctx: ProviderFetchContext): Promise<ProviderFetchResult>
  /** Whether the pipeline should try the next strategy after this error. */
  shouldFallback?(error: unknown, ctx: ProviderFetchContext): boolean
}

export interface ProviderFetchAttempt {
  strategyId: string
  ok: boolean
  error?: string
  skipped?: boolean
}

export interface ProviderFetchOutcome {
  result?: ProviderFetchResult
  error?: unknown
  attempts: ProviderFetchAttempt[]
}

export interface ProviderMetadata {
  displayName: string
  /** Label for the primary lane, e.g. "5h limit" / "Session". */
  sessionLabel: string
  /** Label for the secondary lane, e.g. "Weekly limit". */
  weeklyLabel: string
  supportsCredits?: boolean
  defaultEnabled?: boolean
  dashboardUrl?: string
  statusPageUrl?: string
  /** Brand accent as CSS color. */
  color?: string
}

export interface ProviderDescriptor {
  id: string
  metadata: ProviderMetadata
  /** Strategies in priority order for a given source mode. */
  strategies(mode: ProviderSourceMode): ProviderFetchStrategy[]
}

const matchesMode = (kind: ProviderFetchKind, mode: ProviderSourceMode): boolean => {
  if (mode === 'auto') return true
  if (mode === 'web') return kind === 'web'
  if (mode === 'cli') return kind === 'cli' || kind === 'localProbe'
  if (mode === 'oauth') return kind === 'oauth'
  return kind === 'apiToken'
}

/** Filter a full priority list down to the requested source mode. */
export const forMode = (
  all: ProviderFetchStrategy[],
  mode: ProviderSourceMode,
): ProviderFetchStrategy[] => all.filter((s) => matchesMode(s.kind, mode))

/** Run strategies in priority order with availability checks and fallback. */
export const runPipeline = async (
  descriptor: ProviderDescriptor,
  ctx: ProviderFetchContext,
): Promise<ProviderFetchOutcome> => {
  const attempts: ProviderFetchAttempt[] = []
  let lastError: unknown
  for (const strategy of descriptor.strategies(ctx.sourceMode)) {
    if (!(await strategy.isAvailable(ctx))) {
      attempts.push({ strategyId: strategy.id, ok: false, skipped: true })
      continue
    }
    try {
      const result = await strategy.fetch(ctx)
      attempts.push({ strategyId: strategy.id, ok: true })
      return { result, attempts }
    } catch (error) {
      attempts.push({
        strategyId: strategy.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
      lastError = error
      const fallback = strategy.shouldFallback?.(error, ctx) ?? true
      if (!fallback) break
    }
  }
  return { error: lastError ?? new Error(`${descriptor.id}: no strategy available`), attempts }
}
