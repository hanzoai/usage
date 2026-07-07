// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// UsageStore — port of CodexBar's UsageStore + AdaptiveRefreshPolicy: central
// observable state, concurrent refresh across providers, poll timer, and
// plan-utilization history capture (schema-compatible with the Swift app).

import type {
  PlanUtilizationHistoryFile,
  PlanUtilizationSeriesHistory,
  CreditsSnapshot,
  UsageSnapshot,
} from './types.js'
import type {
  ProviderDescriptor,
  ProviderFetchAttempt,
  ProviderFetchContext,
  ProviderSettings,
  ProviderSourceMode,
} from './provider.js'
import { runPipeline } from './provider.js'
import type { UsageHost } from './host.js'

export interface ProviderState {
  snapshot?: UsageSnapshot
  credits?: CreditsSnapshot
  error?: string
  sourceLabel?: string
  attempts?: ProviderFetchAttempt[]
  refreshing: boolean
}

export interface UsageStoreState {
  providers: Record<string, ProviderState>
  refreshing: boolean
  lastRefreshAt?: string
}

export interface UsageStoreOptions {
  host: UsageHost
  providers: ProviderDescriptor[]
  sourceMode?: ProviderSourceMode
  settings?: Record<string, ProviderSettings>
  /** Poll interval in ms; default 5 minutes (CodexBar's default). */
  intervalMs?: number
  /** Directory for history JSON files; omit to keep history in memory only. */
  historyDir?: string
}

type Listener = () => void

const HISTORY_MAX_ENTRIES = 2000

export class UsageStore {
  private readonly opts: UsageStoreOptions
  private state: UsageStoreState = { providers: {}, refreshing: false }
  private listeners = new Set<Listener>()
  private timer: ReturnType<typeof setInterval> | undefined
  private history = new Map<string, PlanUtilizationSeriesHistory[]>()

  constructor(opts: UsageStoreOptions) {
    this.opts = opts
    for (const p of opts.providers) {
      this.state.providers[p.id] = { refreshing: false }
    }
  }

  getState(): UsageStoreState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(next: Partial<UsageStoreState>): void {
    this.state = { ...this.state, ...next }
    for (const l of this.listeners) l()
  }

  private setProvider(id: string, patch: Partial<ProviderState>): void {
    this.emit({
      providers: {
        ...this.state.providers,
        [id]: { ...this.state.providers[id], refreshing: false, ...patch },
      },
    })
  }

  async refresh(providerId?: string): Promise<void> {
    const targets = this.opts.providers.filter((p) => !providerId || p.id === providerId)
    this.emit({ refreshing: true })
    await Promise.all(targets.map((p) => this.refreshProvider(p)))
    this.emit({ refreshing: false, lastRefreshAt: this.opts.host.now().toISOString() })
  }

  private async refreshProvider(descriptor: ProviderDescriptor): Promise<void> {
    this.setProvider(descriptor.id, { refreshing: true })
    const ctx: ProviderFetchContext = {
      host: this.opts.host,
      sourceMode: this.opts.sourceMode ?? 'auto',
      settings: this.opts.settings?.[descriptor.id],
    }
    const outcome = await runPipeline(descriptor, ctx)
    if (outcome.result) {
      this.setProvider(descriptor.id, {
        snapshot: outcome.result.usage,
        credits: outcome.result.credits,
        sourceLabel: outcome.result.sourceLabel,
        attempts: outcome.attempts,
        error: undefined,
      })
      await this.captureHistory(outcome.result.usage)
    } else {
      // Keep stale data over flapping — errors annotate, they don't erase.
      this.setProvider(descriptor.id, {
        error:
          outcome.error instanceof Error ? outcome.error.message : String(outcome.error),
        attempts: outcome.attempts,
      })
    }
  }

  start(): void {
    if (this.timer) return
    const interval = this.opts.intervalMs ?? 5 * 60 * 1000
    this.timer = setInterval(() => void this.refresh(), interval)
    void this.refresh()
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = undefined
  }

  // ---- plan-utilization history (sparkline data) ----

  getHistory(providerId: string): PlanUtilizationSeriesHistory[] {
    return this.history.get(providerId) ?? []
  }

  private async captureHistory(snapshot: UsageSnapshot): Promise<void> {
    const lanes: Array<{ name: string; windowMinutes: number; usedPercent?: number; resetsAt?: string }> = [
      {
        name: 'session',
        windowMinutes: snapshot.primary?.windowMinutes ?? 300,
        usedPercent: snapshot.primary?.usedPercent,
        resetsAt: snapshot.primary?.resetsAt,
      },
      {
        name: 'weekly',
        windowMinutes: snapshot.secondary?.windowMinutes ?? 10_080,
        usedPercent: snapshot.secondary?.usedPercent,
        resetsAt: snapshot.secondary?.resetsAt,
      },
    ]
    let series = this.history.get(snapshot.providerId)
    if (!series) {
      series = await this.loadHistory(snapshot.providerId)
      this.history.set(snapshot.providerId, series)
    }
    const capturedAt = snapshot.updatedAt
    // Hour-bucketed dedup, as the Swift store does.
    const bucket = capturedAt.slice(0, 13)
    for (const lane of lanes) {
      if (typeof lane.usedPercent !== 'number') continue
      let s = series.find((x) => x.name === lane.name)
      if (!s) {
        s = { name: lane.name, windowMinutes: lane.windowMinutes, entries: [] }
        series.push(s)
      }
      const last = s.entries.at(-1)
      if (last && last.capturedAt.slice(0, 13) === bucket) {
        last.usedPercent = lane.usedPercent
        last.resetsAt = lane.resetsAt
      } else {
        s.entries.push({ capturedAt, usedPercent: lane.usedPercent, resetsAt: lane.resetsAt })
        if (s.entries.length > HISTORY_MAX_ENTRIES) s.entries.splice(0, s.entries.length - HISTORY_MAX_ENTRIES)
      }
    }
    await this.persistHistory(snapshot.providerId, series)
  }

  private historyPath(providerId: string): string | undefined {
    return this.opts.historyDir ? `${this.opts.historyDir}/${providerId}.json` : undefined
  }

  private async loadHistory(providerId: string): Promise<PlanUtilizationSeriesHistory[]> {
    const path = this.historyPath(providerId)
    if (!path) return []
    const text = await this.opts.host.readTextFile(path)
    if (!text) return []
    try {
      const file = JSON.parse(text) as PlanUtilizationHistoryFile
      return file.version === 1 ? file.unscoped : []
    } catch {
      return []
    }
  }

  private async persistHistory(
    providerId: string,
    series: PlanUtilizationSeriesHistory[],
  ): Promise<void> {
    const path = this.historyPath(providerId)
    if (!path) return
    const file: PlanUtilizationHistoryFile = { version: 1, unscoped: series }
    await this.opts.host.writeTextFile(path, JSON.stringify(file))
  }
}
