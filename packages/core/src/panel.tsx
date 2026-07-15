// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// <UsagePanel> — the ONE canonical AI-usage surface every Hanzo app renders.
//
// It renders a full `CloudUsageOverview` (the server-owned shape from
// `GET /v1/get-cloud-usages`): totals cards with prior-period deltas, a spend/token/
// request time series, spend-by-model, and the recent-activity feed. This replaces
// the per-surface re-implementations (console's re-derivation, the orphaned @hanzo/ui
// usage kit, the shadcn billing panel) with a single component.
//
// Two entry modes, discriminated by props:
//   • { data }                     — render an overview the caller already has (a
//                                    surface with its own auth/proxy fetches it and
//                                    passes it in; it may also pass loading/error).
//   • { baseUrl, token, range, org } — fetch it here via the canonical read.
//
// Built only on @hanzo/gui primitives (like console) so it themes to the shell and
// works web + native + desktop. Honest by construction: an absent value is an
// em-dash, an empty window renders its honest empty state, a failed read renders a
// typed error with retry — NEVER fabricated spend, tokens, or trend.
'use client'

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Activity, Boxes, Coins, DollarSign, Layers, RefreshCw } from '@hanzogui/lucide-icons-2'

import type {
  CloudUsageActivityRow,
  CloudUsageOverview,
  CloudUsageSeriesPoint,
  FetchCloudUsageOptions,
  UsageRange,
} from './cloud-usage'
import { fetchCloudUsage } from './cloud-usage'
import { formatBucket, formatCents, formatCount } from './format'
// The palette + chart marks + chrome are shared with <ConnectedUsage> (one visual
// language for native + imported usage). See marks.tsx.
import { BarSeries, colorAt, DOWN, MeterBar, MetricTile, Panel, SERIES, UP } from './marks'

// ── sub-parts (each renders one region of the overview) ──────────────────────────

/** Totals cards + prior-period deltas. */
export function UsageOverview({ data }: { data: CloudUsageOverview }) {
  const s = data.series
  const t = data.totals
  const d = data.deltas
  return (
    <XStack flexWrap="wrap" gap="$3">
      <MetricTile icon={<DollarSign size={16} color="#7ee787" />} label="Spend" value={formatCents(t.spendCents)} deltaPct={d.spendCents?.pct ?? null} spark={s.map((p) => p.spendCents)} sparkColor="#7ee787" />
      <MetricTile icon={<Coins size={16} color="#6ea8fe" />} label="Tokens" value={formatCount(t.tokens)} deltaPct={d.tokens?.pct ?? null} spark={s.map((p) => p.tokens)} sparkColor="#6ea8fe" />
      <MetricTile icon={<Activity size={16} color="#f0a868" />} label="Requests" value={formatCount(t.requests)} deltaPct={d.requests?.pct ?? null} spark={s.map((p) => p.requests)} sparkColor="#f0a868" />
      <MetricTile icon={<Layers size={16} color="#c792ea" />} label="Models" value={formatCount(t.models)} deltaPct={d.models?.pct ?? null} />
      <MetricTile icon={<Boxes size={16} color="#56d4c4" />} label="Providers" value={formatCount(t.providers)} />
    </XStack>
  )
}

type ChartMetric = 'spendCents' | 'tokens' | 'requests'
const CHART_METRICS: { key: ChartMetric; label: string; color: string }[] = [
  { key: 'spendCents', label: 'Spend', color: '#7ee787' },
  { key: 'tokens', label: 'Tokens', color: '#6ea8fe' },
  { key: 'requests', label: 'Requests', color: '#f0a868' },
]
const seriesValue = (p: CloudUsageSeriesPoint, m: ChartMetric): number => (m === 'spendCents' ? p.spendCents : m === 'tokens' ? p.tokens : p.requests)
const seriesHint = (p: CloudUsageSeriesPoint, m: ChartMetric, interval: string): string => `${formatBucket(p.t, interval)} · ${m === 'spendCents' ? formatCents(p.spendCents) : `${formatCount(seriesValue(p, m))} ${m}`}`

/** The time series — spend / tokens / requests over the window, one bar per bucket. */
export function UsageChart({ data }: { data: CloudUsageOverview }) {
  const [metric, setMetric] = useState<ChartMetric>('spendCents')
  const active = CHART_METRICS.find((m) => m.key === metric) ?? CHART_METRICS[0]!
  const bars = data.series.map((p) => ({ label: p.t, value: seriesValue(p, metric), hint: seriesHint(p, metric, data.interval) }))
  const hasData = bars.some((b) => b.value > 0)
  return (
    <Panel
      title="Usage over time"
      action={
        <XStack gap="$1">
          {CHART_METRICS.map((m) => (
            <Button key={m.key} size="$2" chromeless={metric !== m.key} onPress={() => setMetric(m.key)} aria-label={`Show ${m.label}`}>
              {m.label}
            </Button>
          ))}
        </XStack>
      }
    >
      {hasData ? (
        <BarSeries bars={bars} color={active.color} />
      ) : (
        <Text fontSize="$3" color="$color10">
          No {active.label.toLowerCase()} recorded in this range yet.
        </Text>
      )}
    </Panel>
  )
}

/** Spend-by-model — the top-N models plus a folded "Other", each a share meter. */
export function UsageBreakdown({ data }: { data: CloudUsageOverview }) {
  const bm = data.byModel
  const rows: { key: string; model: string; provider: string; spendCents: number; pct: number; color: string }[] = bm.items.map((m, i) => ({
    key: `${m.model}-${i}`,
    model: m.model || 'unknown',
    provider: m.provider,
    spendCents: m.spendCents,
    pct: m.pct,
    color: colorAt(i),
  }))
  if (bm.other) {
    rows.push({ key: 'other', model: `Other (${bm.other.modelCount})`, provider: 'remaining models', spendCents: bm.other.spendCents, pct: bm.other.pct, color: '#64748b' })
  }
  return (
    <Panel title="Spend by model" action={<Text fontSize="$2" color="$color11">{formatCents(bm.totalCents)}</Text>}>
      {rows.length ? (
        <YStack gap="$3">
          {rows.map((r) => (
            <YStack key={r.key} gap="$1.5">
              <XStack items="center" justify="space-between" gap="$2">
                <XStack items="center" gap="$2" flex={1}>
                  <YStack width={9} height={9} rounded="$1" bg={r.color as never} />
                  <Text fontSize="$3" fontWeight="600" color="$color12" numberOfLines={1}>
                    {r.model}
                  </Text>
                  <Text fontSize="$1" color="$color10" numberOfLines={1}>
                    {r.provider}
                  </Text>
                </XStack>
                <Text fontSize="$3" color="$color12" fontWeight="600">
                  {formatCents(r.spendCents)}
                </Text>
              </XStack>
              <MeterBar pct={r.pct} color={r.color} />
            </YStack>
          ))}
        </YStack>
      ) : (
        <Text fontSize="$3" color="$color10">
          No model spend in this range yet.
        </Text>
      )}
    </Panel>
  )
}

const statusTone = (s: string): string => {
  const v = s.toLowerCase()
  if (v === 'success' || v === 'ok' || v === '') return UP
  if (v === 'error' || v === 'failed') return DOWN
  return '#f0a868'
}
const activityTime = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** The recent-activity feed — newest inference calls with model, tokens, cost, status. */
export function UsageActivity({ data }: { data: CloudUsageOverview }) {
  const items = data.activity.items
  return (
    <Panel title="Recent activity" action={data.activity.total ? <Text fontSize="$2" color="$color11">{formatCount(data.activity.total)} calls</Text> : undefined}>
      {items.length ? (
        <YStack>
          {items.map((r: CloudUsageActivityRow, i) => (
            <XStack key={r.requestId || `${r.time}-${i}`} items="center" gap="$2" py="$2" borderColor="$borderColor" borderBottomWidth={i < items.length - 1 ? 1 : 0}>
              <YStack width={7} height={7} rounded="$10" bg={statusTone(r.status) as never} />
              <YStack flex={1} gap="$0.5">
                <Text fontSize="$3" fontWeight="600" color="$color12" numberOfLines={1}>
                  {r.model || 'inference'}
                </Text>
                <Text fontSize="$1" color="$color10" numberOfLines={1}>
                  {[r.provider, activityTime(r.time)].filter(Boolean).join(' · ')}
                </Text>
              </YStack>
              <Text fontSize="$2" color="$color11" numberOfLines={1}>
                {formatCount(r.tokens)} tok
              </Text>
              <Text fontSize="$2" color="$color12" fontWeight="600" numberOfLines={1}>
                {formatCents(r.costCents)}
              </Text>
            </XStack>
          ))}
        </YStack>
      ) : (
        <Text fontSize="$3" color="$color10">
          No activity in this range yet.
        </Text>
      )}
    </Panel>
  )
}

// ── the panel (composition + range control + fetch/data modes) ───────────────────

const RANGES: UsageRange[] = ['24h', '7d', '30d']

function RangeTabs({ value, onChange }: { value: UsageRange; onChange: (r: UsageRange) => void }) {
  return (
    <XStack gap="$1">
      {RANGES.map((r) => (
        <Button key={r} size="$2" chromeless={value !== r} onPress={() => onChange(r)} aria-label={`Range ${r}`}>
          {r}
        </Button>
      ))}
    </XStack>
  )
}

/** Which regions to render (all on by default). */
export interface UsageSections {
  overview?: boolean
  chart?: boolean
  breakdown?: boolean
  activity?: boolean
}

interface UsagePanelBase {
  title?: string
  subtitle?: string
  sections?: UsageSections
  /** Controlled range + range tabs. In fetch mode the panel manages this itself. */
  range?: UsageRange
  onRangeChange?: (r: UsageRange) => void
}

/** Render an overview the caller already fetched (with its own auth/proxy). The
 *  caller owns the async: pass `loading` while it fetches, `error`+`onRetry` on a
 *  failure, and `data` once ready — the panel renders the honest state for each. */
export interface UsagePanelDataProps extends UsagePanelBase {
  data?: CloudUsageOverview | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

/** Fetch the overview here via the canonical bearer read. */
export interface UsagePanelFetchProps extends UsagePanelBase, Omit<FetchCloudUsageOptions, 'range'> {}

export type UsagePanelProps = UsagePanelDataProps | UsagePanelFetchProps

// Fetch mode is the ONLY variant that carries a `baseUrl` — everything else renders
// caller-supplied data.
const isDataMode = (p: UsagePanelProps): p is UsagePanelDataProps => !('baseUrl' in p)

function Sections({ data, sections }: { data: CloudUsageOverview; sections?: UsageSections }) {
  const show = { overview: true, chart: true, breakdown: true, activity: true, ...sections }
  return (
    <YStack gap="$4">
      {show.overview ? <UsageOverview data={data} /> : null}
      {show.chart ? <UsageChart data={data} /> : null}
      {show.breakdown || show.activity ? (
        <XStack flexWrap="wrap" gap="$4">
          {show.breakdown ? <UsageBreakdown data={data} /> : null}
          {show.activity ? <UsageActivity data={data} /> : null}
        </XStack>
      ) : null}
    </YStack>
  )
}

function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <XStack items="flex-start" justify="space-between" gap="$3" flexWrap="wrap">
      <YStack gap="$1">
        <Text fontSize="$6" fontWeight="900" color="$color12">
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize="$2" color="$color10">
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {right}
    </XStack>
  )
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <YStack p="$5" gap="$3" borderWidth={1} borderColor="$borderColor" rounded="$4" bg="$color1" items="center">
      <Text fontSize="$4" fontWeight="700" color="$color12">
        Usage is unavailable
      </Text>
      <Text fontSize="$2" color="$color10" style={{ textAlign: 'center' }}>
        {message}
      </Text>
      {onRetry ? (
        <Button size="$2" icon={<RefreshCw size={15} />} onPress={onRetry}>
          Retry
        </Button>
      ) : null}
    </YStack>
  )
}

type FetchState = { phase: 'loading' } | { phase: 'error'; message: string } | { phase: 'ready'; data: CloudUsageOverview }

/**
 * The ONE usage component. In fetch mode it owns range + the canonical read; in data
 * mode it renders what the caller passes (and its loading/error). Both render the
 * exact same sub-parts, so every Hanzo surface shows usage the same way.
 */
export function UsagePanel(props: UsagePanelProps): ReactElement {
  const title = props.title ?? 'Usage'

  if (isDataMode(props)) {
    const right = props.onRangeChange && props.range ? <RangeTabs value={props.range} onChange={props.onRangeChange} /> : undefined
    return (
      <YStack gap="$4">
        <Header title={title} subtitle={props.subtitle} right={right} />
        {props.error ? (
          <ErrorCard message={props.error} onRetry={props.onRetry} />
        ) : props.loading || !props.data ? (
          <Text fontSize="$3" color="$color10">
            Loading usage…
          </Text>
        ) : (
          <Sections data={props.data} sections={props.sections} />
        )}
      </YStack>
    )
  }

  return <FetchingUsagePanel {...props} title={title} />
}

/** Fetch-mode body — isolated so hooks never sit behind the data-mode branch. */
function FetchingUsagePanel(props: UsagePanelFetchProps & { title: string }): ReactElement {
  const [range, setRange] = useState<UsageRange>(props.range ?? '24h')
  const [state, setState] = useState<FetchState>({ phase: 'loading' })
  const [nonce, setNonce] = useState(0)
  const { baseUrl, token, org, start, end, topModels, activityType, activityLimit, activityOffset } = props
  const fetchImpl = props.fetch
  const seq = useRef(0)

  useEffect(() => {
    const id = ++seq.current
    const ctrl = new AbortController()
    setState({ phase: 'loading' })
    fetchCloudUsage({ baseUrl, token, org, range, start, end, topModels, activityType, activityLimit, activityOffset, signal: ctrl.signal, fetch: fetchImpl })
      .then((data) => {
        if (id === seq.current) setState({ phase: 'ready', data })
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted || id !== seq.current) return
        setState({ phase: 'error', message: e instanceof Error ? e.message : String(e) })
      })
    return () => ctrl.abort()
  }, [baseUrl, token, org, range, start, end, topModels, activityType, activityLimit, activityOffset, fetchImpl, nonce])

  const onRange = (r: UsageRange) => {
    setRange(r)
    props.onRangeChange?.(r)
  }

  return (
    <YStack gap="$4">
      <Header title={props.title} subtitle={props.subtitle} right={<RangeTabs value={range} onChange={onRange} />} />
      {state.phase === 'error' ? (
        <ErrorCard message={state.message} onRetry={() => setNonce((n) => n + 1)} />
      ) : state.phase === 'loading' ? (
        <Text fontSize="$3" color="$color10">
          Loading usage…
        </Text>
      ) : (
        <Sections data={state.data} sections={props.sections} />
      )}
    </YStack>
  )
}
