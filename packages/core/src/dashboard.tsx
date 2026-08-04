// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// The ONE Usage view — a self-contained React dashboard every surface renders
// (Desktop / App / Chat / Console / CLI-webview). Plain DOM elements styled from
// the shared palette (palette.ts) through the standard Hanzo theme custom
// properties, so it themes to its host with no Tailwind, no utility classes and no
// stylesheet contract; brand + host are injected by the caller.

import { useEffect, useState, type CSSProperties } from 'react'

import { allProviders } from './index.js'
import { SERIES, TOKEN, TRACK } from './palette.js'
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

// ── styles (one place; theme tokens + the shared palette) ─────────────────────

const S = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    padding: '1rem',
    color: TOKEN.fg,
    background: TOKEN.card,
    border: `1px solid ${TOKEN.border}`,
    borderRadius: TOKEN.radius,
  },
  head: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' },
  identity: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  name: { margin: 0, fontSize: '1rem', fontWeight: 600 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' },
  lanes: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  lane: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  track: { height: 8, overflow: 'hidden', borderRadius: 9999, background: TRACK },
  muted: { color: TOKEN.muted, fontSize: '0.75rem', margin: 0 },
  secondary: { color: TOKEN.muted },
  value: { fontSize: '0.75rem' },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: 9999,
    border: `2px solid ${TOKEN.muted}`,
    borderTopColor: 'transparent',
    animation: 'hz-usage-spin 900ms linear infinite',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '2.5rem 1rem',
    textAlign: 'center',
    background: TOKEN.card,
    border: `1px solid ${TOKEN.border}`,
    borderRadius: TOKEN.radius,
  },
  skeleton: {
    height: 160,
    width: '100%',
    background: TOKEN.card,
    borderRadius: TOKEN.radius,
    animation: 'hz-usage-pulse 1.6s ease-in-out infinite',
  },
} satisfies Record<string, CSSProperties>

const dot = (color: string): CSSProperties => ({ width: 10, height: 10, borderRadius: 9999, background: color, flexShrink: 0 })
const fill = (pct: number): CSSProperties => ({ height: '100%', width: `${pct}%`, borderRadius: 9999, background: SERIES[0], transition: 'width 200ms ease' })

/** The two keyframes the view uses. React 19 hoists + de-dupes by `href`. */
const Motion = () => (
  <style href="@hanzo/usage" precedence="default">
    {'@keyframes hz-usage-spin{to{transform:rotate(360deg)}}@keyframes hz-usage-pulse{50%{opacity:0.45}}'}
  </style>
)

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
    <div style={S.lane}>
      <div style={S.row}>
        <span style={S.secondary}>{label}</span>
        <span style={S.value}>{used}% used</span>
      </div>
      <div
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={used}
        role="progressbar"
        style={S.track}
      >
        <div style={fill(used)} />
      </div>
      {reset ? <p style={S.muted}>{reset}</p> : null}
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
    <div style={S.card}>
      <div style={S.head}>
        <div style={S.identity}>
          <span style={dot(meta.color ?? '#6b7280')} />
          <div>
            <h3 style={S.name}>{meta.displayName}</h3>
            {identity?.plan || identity?.accountEmail ? (
              <p style={S.muted}>
                {[identity.plan, identity.accountEmail]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}
          </div>
        </div>
        {state?.refreshing ? (
          <>
            <Motion />
            <span aria-label="Refreshing" role="status" style={S.spinner} />
          </>
        ) : null}
      </div>

      {state?.error ? (
        <p style={S.muted}>Not connected — {state.error}</p>
      ) : hasData ? (
        <div style={S.lanes}>
          <Lane label={meta.sessionLabel} window={snapshot?.primary} />
          <Lane label={meta.weeklyLabel} window={snapshot?.secondary} />
          {cost ? (
            <div style={S.row}>
              <span style={S.secondary}>Spend</span>
              <span style={S.value}>
                {cost.currencyCode} {cost.used.toFixed(2)}
                {cost.limit != null ? (
                  <span style={S.secondary}> / {cost.limit.toFixed(2)}</span>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <p style={S.muted}>
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
    <div style={S.grid}>
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
      <div style={S.empty}>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
          Connect your AI providers
        </p>
        <p style={{ ...S.muted, maxWidth: '24rem' }}>
          {emptyHint ??
            'Provider usage is tracked from the app. Sign in to your AI providers locally to see session and weekly limits here.'}
        </p>
      </div>
    )
  }

  return (
    <div style={S.grid}>
      <Motion />
      <div style={S.skeleton} />
      <div style={S.skeleton} />
    </div>
  )
}
