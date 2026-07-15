// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// <ConnectedUsage> — the imported third-party usage surface, rendered RIGHT NEXT TO the
// native <UsagePanel> so a customer sees their OpenAI / Anthropic / Google spend beside
// their Hanzo usage in one place. It renders a list of `ProviderUsage` values (the
// server-owned shape from `GET /v1/ai/connections/:provider/usage`), each a card with
// totals + a day-bucketed chart + spend-by-model — using the SAME marks/chrome as the
// native panel (marks.tsx), so the two planes read as one system.
//
// Honest by construction: a not-connected provider shows a "connect" affordance, a
// scope-denied provider shows the server's human note (e.g. "needs an Admin API key"),
// an empty window shows its empty state — NEVER a fabricated figure. Data mode only:
// the caller owns the async (the console fetches over its cookie proxy; a bearer surface
// fetches via fetchProviderUsage) and passes the values in, exactly like <UsagePanel>.
'use client'

import { type ReactElement, type ReactNode } from 'react'
import { Button, Text, XStack, YStack } from '@hanzo/gui'
import { Activity, Coins, DollarSign, RefreshCw } from '@hanzogui/lucide-icons-2'

import type { ProviderUsage, ProviderUsageModelSpend } from './provider-usage'
import { formatBucket, formatCents, formatCount } from './format'
import { BarSeries, colorAt, DOWN, MeterBar, SERIES, UP } from './marks'

// ── provider display meta (label + brand accent) ─────────────────────────────────────

const PROVIDER_META: Record<string, { label: string; color: string }> = {
  openai: { label: 'OpenAI', color: '#10a37f' },
  anthropic: { label: 'Anthropic', color: '#d97757' },
  google: { label: 'Google Gemini', color: '#4285f4' },
}

const metaFor = (provider: string): { label: string; color: string } =>
  PROVIDER_META[provider] ?? { label: provider ? provider[0]!.toUpperCase() + provider.slice(1) : 'Provider', color: SERIES[0] as string }

// ── small parts ──────────────────────────────────────────────────────────────────────

/** A compact label/value pair (the connected card's stat row — narrower than the big
 *  overview MetricTile, so several provider cards fit side by side). */
function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }): ReactElement {
  return (
    <YStack gap="$1" flex={1} minW={92}>
      <XStack items="center" gap="$1.5">
        {icon}
        <Text fontSize="$1" color="$color11" numberOfLines={1}>
          {label}
        </Text>
      </XStack>
      <Text fontSize="$6" fontWeight="900" color="$color12" numberOfLines={1}>
        {value}
      </Text>
    </YStack>
  )
}

/** The connected/available state pill in a provider card's header. */
function StatePill({ usage }: { usage: ProviderUsage }): ReactElement {
  const [label, tone] = !usage.connected
    ? (['Not connected', '$color10'] as const)
    : usage.available
      ? (['Imported', UP] as const)
      : (['Connected', '#f0a868'] as const)
  return (
    <Text fontSize="$1" fontWeight="700" color={tone as never}>
      {label}
    </Text>
  )
}

/** The share meter for one provider's spend-by-model (top-N + honest "Other" tail). */
function ModelRows({ models, total, metric }: { models: ProviderUsageModelSpend[]; total: number; metric: 'spend' | 'tokens' }): ReactElement | null {
  if (!models.length || total <= 0) return null
  const top = models.slice(0, 5)
  const rest = models.slice(5)
  const rows = top.map((m, i) => {
    const value = metric === 'spend' ? m.spendCents : m.tokens
    return { key: `${m.model}-${i}`, model: m.model || 'unknown', valueLabel: metric === 'spend' ? formatCents(m.spendCents) : `${formatCount(m.tokens)} tok`, pct: (value / total) * 100, color: colorAt(i) }
  })
  if (rest.length) {
    const restValue = rest.reduce((s, m) => s + (metric === 'spend' ? m.spendCents : m.tokens), 0)
    rows.push({ key: 'other', model: `Other (${rest.length})`, valueLabel: metric === 'spend' ? formatCents(restValue) : `${formatCount(restValue)} tok`, pct: (restValue / total) * 100, color: '#64748b' })
  }
  return (
    <YStack gap="$2">
      {rows.map((r) => (
        <YStack key={r.key} gap="$1">
          <XStack items="center" justify="space-between" gap="$2">
            <XStack items="center" gap="$2" flex={1}>
              <YStack width={8} height={8} rounded="$1" bg={r.color as never} />
              <Text fontSize="$2" fontWeight="600" color="$color12" numberOfLines={1}>
                {r.model}
              </Text>
            </XStack>
            <Text fontSize="$2" color="$color12" fontWeight="600">
              {r.valueLabel}
            </Text>
          </XStack>
          <MeterBar pct={r.pct} color={r.color} />
        </YStack>
      ))}
    </YStack>
  )
}

/** One connected provider — totals, a day-bucketed chart, and spend/tokens by model,
 *  or its honest not-connected / scope-denied / empty state. */
export function ProviderUsageCard({ usage }: { usage: ProviderUsage }): ReactElement {
  const meta = metaFor(usage.provider)
  const t = usage.totals
  const hasSpend = t.spendCents > 0
  const metric: 'spend' | 'tokens' = hasSpend ? 'spend' : 'tokens'
  const bars = usage.series.map((p) => ({
    label: p.t,
    value: metric === 'spend' ? p.spendCents : p.tokens,
    hint: `${formatBucket(p.t, usage.interval || 'day')} · ${metric === 'spend' ? formatCents(p.spendCents) : `${formatCount(p.tokens)} tok`}`,
  }))
  const modelTotal = usage.byModel.reduce((s, m) => s + (metric === 'spend' ? m.spendCents : m.tokens), 0)

  return (
    <YStack flex={1} minW={360} gap="$3" p="$4" borderWidth={1} borderColor="$borderColor" rounded="$4" bg="$color1">
      <XStack items="center" justify="space-between" gap="$2">
        <XStack items="center" gap="$2" flex={1}>
          <YStack width={10} height={10} rounded="$2" bg={meta.color as never} />
          <Text fontSize="$4" fontWeight="800" color="$color12" numberOfLines={1}>
            {meta.label}
          </Text>
        </XStack>
        <StatePill usage={usage} />
      </XStack>

      {!usage.connected ? (
        <Text fontSize="$3" color="$color10">
          {usage.note || `Connect your ${meta.label} account to import its usage.`}
        </Text>
      ) : !usage.available ? (
        <Text fontSize="$3" color="$color10">
          {usage.note || `${meta.label} reported no usage for this period.`}
        </Text>
      ) : (
        <YStack gap="$3">
          <XStack flexWrap="wrap" gap="$3">
            <Stat icon={<DollarSign size={14} color="#7ee787" />} label="Spend" value={hasSpend ? formatCents(t.spendCents) : '—'} />
            <Stat icon={<Coins size={14} color="#6ea8fe" />} label="Tokens" value={formatCount(t.tokens)} />
            <Stat icon={<Activity size={14} color="#f0a868" />} label="Requests" value={t.requests > 0 ? formatCount(t.requests) : '—'} />
          </XStack>
          {bars.some((b) => b.value > 0) ? <BarSeries bars={bars} height={96} color={meta.color} /> : null}
          <ModelRows models={usage.byModel} total={modelTotal} metric={metric} />
          {usage.note ? (
            <Text fontSize="$1" color="$color10">
              {usage.note}
            </Text>
          ) : null}
        </YStack>
      )}
    </YStack>
  )
}

// ── the section ────────────────────────────────────────────────────────────────────

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
      <Text fontSize="$4" fontWeight="700" color={DOWN as never}>
        Connected usage is unavailable
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

export interface ConnectedUsageProps {
  /** The imported per-provider usage values the caller fetched (native panel's data mode). */
  items?: ProviderUsage[] | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  title?: string
  subtitle?: string
  /** An affordance rendered in the header (e.g. a "Manage connections" link). */
  headerAction?: ReactNode
}

/**
 * The connected-providers section. Renders one card per provider value the caller
 * supplies; honest loading / error / empty states; never fabricates a figure. Compose it
 * directly under a native `<UsagePanel>` to get the cross-provider plane.
 */
export function ConnectedUsage(props: ConnectedUsageProps): ReactElement {
  const title = props.title ?? 'Connected providers'
  const items = props.items ?? []
  return (
    <YStack gap="$4">
      <Header title={title} subtitle={props.subtitle} right={props.headerAction} />
      {props.error ? (
        <ErrorCard message={props.error} onRetry={props.onRetry} />
      ) : props.loading && items.length === 0 ? (
        <Text fontSize="$3" color="$color10">
          Loading connected usage…
        </Text>
      ) : items.length === 0 ? (
        <YStack p="$5" gap="$2" borderWidth={1} borderColor="$borderColor" rounded="$4" bg="$color1">
          <Text fontSize="$4" fontWeight="700" color="$color12">
            No connected providers yet
          </Text>
          <Text fontSize="$2" color="$color10">
            Connect your OpenAI, Anthropic, or Google account to import its spend and usage here, alongside your Hanzo usage.
          </Text>
        </YStack>
      ) : (
        <XStack flexWrap="wrap" gap="$4">
          {items.map((u) => (
            <ProviderUsageCard key={u.provider} usage={u} />
          ))}
        </XStack>
      )}
    </YStack>
  )
}
