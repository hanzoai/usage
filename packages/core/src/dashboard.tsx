// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// The ONE Usage view — a self-contained React dashboard every surface renders
// (Desktop / App / Chat / Console / CLI-webview). No @hanzo/ui, lucide, or
// date-fns coupling: plain elements with semantic Tailwind token classes the
// host theme supplies (text-text-default, bg-bg-secondary, border-divider, …),
// which degrade to no-ops when absent. Brand + host are injected by the caller;
// nothing surface-specific lives here.

import { useEffect, useState } from 'react'

import { allProviders } from './index.js'
import type { ProviderDescriptor, ProviderMetadata } from './provider.js'
import { UsageStore, type ProviderState } from './store.js'
import type { RateWindow } from './types.js'
import type { UsageHost } from './host.js'
import { useUsage } from './react.js'

/** Relative "Resets in …" without a date library. */
const formatReset = (window: RateWindow): string | null => {
  if (window.resetsAt) {
    const at = new Date(window.resetsAt).getTime()
    if (!Number.isNaN(at)) {
      const ms = at - Date.now()
      const abs = Math.abs(ms)
      const mins = Math.round(abs / 60000)
      const hrs = Math.round(abs / 3600000)
      const days = Math.round(abs / 86400000)
      const rel =
        mins < 60 ? `${mins}m` : hrs < 48 ? `${hrs}h` : `${days}d`
      return ms >= 0 ? `Resets in ${rel}` : `Reset ${rel} ago`
    }
  }
  return window.resetDescription ?? null
}

const clampPct = (n: number): number =>
  Math.max(0, Math.min(100, Math.round(n)))

/** One rate-limit lane (session / weekly / …) with a progress bar. */
export const Lane = ({
  label,
  window,
}: {
  label: string
  window?: RateWindow
}) => {
  if (!window) return null
  const used = clampPct(window.usedPercent)
  const reset = formatReset(window)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-default text-xs">{used}% used</span>
      </div>
      <div
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={used}
        className="h-2 overflow-hidden rounded-full bg-cyan-900"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-cyan-400 transition-[width]"
          style={{ width: `${used}%` }}
        />
      </div>
      {reset ? <p className="text-text-tertiary text-xs">{reset}</p> : null}
    </div>
  )
}

/** A single provider's card: identity, session/weekly lanes, spend. */
export const ProviderCard = ({
  descriptor,
  state,
}: {
  descriptor: ProviderDescriptor
  state?: ProviderState
}) => {
  const meta: ProviderMetadata = descriptor.metadata
  const snapshot = state?.snapshot
  const cost = snapshot?.providerCost
  const identity = snapshot?.identity
  const hasData = !!snapshot?.primary || !!snapshot?.secondary || !!cost

  return (
    <div className="bg-bg-secondary border-divider w-full space-y-4 rounded-lg border px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: meta.color ?? '#6b7280' }}
          />
          <div>
            <h3 className="text-base font-semibold">{meta.displayName}</h3>
            {identity?.plan || identity?.accountEmail ? (
              <p className="text-text-tertiary text-xs">
                {[identity.plan, identity.accountEmail]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}
          </div>
        </div>
        {state?.refreshing ? (
          <span className="border-text-tertiary size-3.5 animate-spin rounded-full border-2 border-t-transparent" />
        ) : null}
      </div>

      {state?.error ? (
        <p className="text-text-tertiary text-xs">
          Not connected — {state.error}
        </p>
      ) : hasData ? (
        <div className="space-y-3">
          <Lane label={meta.sessionLabel} window={snapshot?.primary} />
          <Lane label={meta.weeklyLabel} window={snapshot?.secondary} />
          {cost ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Spend</span>
              <span className="text-text-default text-xs">
                {cost.currencyCode} {cost.used.toFixed(2)}
                {cost.limit != null ? (
                  <span className="text-text-tertiary"> / {cost.limit.toFixed(2)}</span>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-text-tertiary text-xs">
          No usage data yet. Sign in to {meta.displayName} locally to track
          limits here.
        </p>
      )}
    </div>
  )
}

/** The provider grid — subscribes to the store and renders every provider. */
export const ProviderUsageGrid = ({
  store,
  providers = allProviders,
}: {
  store: UsageStore
  providers?: ProviderDescriptor[]
}) => {
  const { providers: states } = useUsage(store)
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {providers.map((descriptor) => (
        <ProviderCard
          descriptor={descriptor}
          key={descriptor.id}
          state={states[descriptor.id]}
        />
      ))}
    </div>
  )
}

export interface UseUsageDashboardOptions {
  /** Build the surface host (tauri/node/web). Called once on mount. */
  createHost: () => Promise<UsageHost> | UsageHost
  /** Providers to track; defaults to the full catalog. */
  providers?: ProviderDescriptor[]
  /** Gate host creation (e.g. isTauriAvailable). Default: always available. */
  available?: () => boolean
}

/**
 * Lifecycle hook: builds the host, starts a UsageStore, tears it down on
 * unmount. Every surface's Usage page reduces to this hook + <ProviderUsageGrid>.
 */
export const useUsageDashboard = (
  opts: UseUsageDashboardOptions,
): { store: UsageStore | null; hostUnavailable: boolean } => {
  const [store, setStore] = useState<UsageStore | null>(null)
  const [hostUnavailable, setHostUnavailable] = useState(false)

  useEffect(() => {
    let disposed = false
    let created: UsageStore | null = null
    void (async () => {
      if (opts.available && !opts.available()) {
        setHostUnavailable(true)
        return
      }
      try {
        const host = await opts.createHost()
        if (disposed) return
        created = new UsageStore({
          host,
          providers: opts.providers ?? allProviders,
        })
        created.start()
        setStore(created)
      } catch {
        if (!disposed) setHostUnavailable(true)
      }
    })()
    return () => {
      disposed = true
      created?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { store, hostUnavailable }
}

/**
 * The full self-contained Usage view: host lifecycle + grid + empty/loading
 * states. Drop-in for any surface — `<UsageDashboard createHost={…} />`.
 */
export const UsageDashboard = ({
  createHost,
  providers,
  available,
  emptyHint,
}: UseUsageDashboardOptions & {
  /** Overrides the "connect your providers" hint copy. */
  emptyHint?: string
}) => {
  const { store, hostUnavailable } = useUsageDashboard({
    createHost,
    providers,
    available,
  })

  if (store) return <ProviderUsageGrid providers={providers} store={store} />

  if (hostUnavailable) {
    return (
      <div className="bg-bg-secondary border-divider flex w-full flex-col items-center gap-2 rounded-lg border px-4 py-10 text-center">
        <p className="text-text-default text-sm font-medium">
          Connect your AI providers
        </p>
        <p className="text-text-tertiary max-w-sm text-xs">
          {emptyHint ??
            'Provider usage is tracked from the app. Sign in to your AI providers locally to see session and weekly limits here.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="bg-bg-secondary h-[160px] w-full animate-pulse rounded-lg" />
      <div className="bg-bg-secondary h-[160px] w-full animate-pulse rounded-lg" />
    </div>
  )
}
