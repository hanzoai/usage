// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// Shared, dependency-free chart marks + chrome for every usage surface — the ONE place
// the palette, sparkline/bar/meter SVG, the card chrome, and the metric tile live, so
// the native <UsagePanel> (cloud usage) and <ConnectedUsage> (imported third-party
// usage) render with the exact same visual language. Built only on @hanzo/gui
// primitives so they theme to the shell and work web + native + desktop.
'use client'

import { type ReactElement, type ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { deltaDirection, formatDeltaPct } from './format'

// ── palette (categorical, dark+light legible — the console SERIES set) ────────────────
export const SERIES = ['#6ea8fe', '#7ee787', '#f0a868', '#c792ea', '#56d4c4', '#e879a6', '#d6c15a', '#8b9bb4'] as const
export const TRACK = 'rgba(128,128,128,0.18)'
export const UP = '#7ee787'
export const DOWN = '#e5534b'
export const colorAt = (i: number): string => SERIES[i % SERIES.length] as string

/** A single-series sparkline over real points; nothing for <2 points. */
export function Sparkline({ points, width = 120, height = 34, color = SERIES[0] }: { points: number[]; width?: number; height?: number; color?: string }): ReactElement | null {
  const clean = (points ?? []).filter((v) => Number.isFinite(v))
  if (clean.length < 2) return null
  const min = Math.min(...clean)
  const max = Math.max(...clean)
  const span = max - min || 1
  const stepX = width / (clean.length - 1)
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4)
  const line = clean.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${y(p).toFixed(1)}`).join(' ')
  const area = `${line} L${(width - 1).toFixed(1)},${height} L1,${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden style={{ display: 'block' }}>
      <path d={area} fill={color} fillOpacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** A vertical-bar series (e.g. spend per bucket). One bar per real datum. */
export function BarSeries({ bars, height = 120, color = SERIES[0] }: { bars: { label: string; value: number; hint: string }[]; height?: number; color?: string }): ReactElement | null {
  if (!bars.length) return null
  const width = 640
  const max = Math.max(...bars.map((b) => b.value), 1)
  const gap = bars.length > 60 ? 1 : 3
  const bw = Math.max(1, (width - gap * (bars.length - 1)) / bars.length)
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="usage over time">
      {bars.map((b, i) => {
        const h = Math.max(1, (b.value / max) * (height - 2))
        return (
          <rect key={`${b.label}-${i}`} x={i * (bw + gap)} y={height - h} width={bw} height={h} rx={2} fill={color} opacity={0.85}>
            <title>{b.hint}</title>
          </rect>
        )
      })}
    </svg>
  )
}

/** A thin 0–100 meter bar in a fixed tone (share-of-total). */
export function MeterBar({ pct, color }: { pct: number; color: string }): ReactElement {
  const v = Math.max(0, Math.min(100, pct))
  return (
    <YStack height={6} bg={TRACK as never} rounded="$2" overflow="hidden">
      <YStack height={6} width={`${Math.max(2, v)}%`} bg={color as never} rounded="$2" />
    </YStack>
  )
}

/** Card chrome: a titled, bordered panel with an optional right-aligned action. */
export function Panel({ title, action, children, minW }: { title: string; action?: ReactNode; children: ReactNode; minW?: number }) {
  return (
    <YStack flex={1} minW={minW ?? 320} gap="$3" p="$4" borderWidth={1} borderColor="$borderColor" rounded="$4" bg="$color1">
      <XStack items="center" justify="space-between" gap="$2">
        <Text fontSize="$4" fontWeight="800" color="$color12">
          {title}
        </Text>
        {action}
      </XStack>
      {children}
    </YStack>
  )
}

/** One overview metric tile: icon + label + value + honest delta chip + sparkline.
 *  `deltaPct` omitted → no delta chip (used where there is no prior-period basis, e.g.
 *  an imported third-party window). */
export function MetricTile({ icon, label, value, deltaPct, spark, sparkColor }: { icon: ReactNode; label: string; value: string; deltaPct?: number | null; spark?: number[]; sparkColor?: string }) {
  const dir = deltaPct === undefined ? 'flat' : deltaDirection(deltaPct ?? null)
  const tone = dir === 'up' ? UP : dir === 'down' ? DOWN : '$color10'
  return (
    <YStack p="$4" gap="$2" borderWidth={1} borderColor="$borderColor" rounded="$4" bg="$color1" flex={1} minW={180}>
      <XStack items="center" gap="$2">
        {icon}
        <Text fontSize="$2" color="$color11" numberOfLines={1}>
          {label}
        </Text>
      </XStack>
      <XStack items="flex-end" justify="space-between" gap="$2">
        <Text fontSize="$7" fontWeight="900" color="$color12">
          {value}
        </Text>
        {deltaPct !== undefined ? (
          <Text fontSize="$1" color={tone as never} fontWeight="700">
            {formatDeltaPct(deltaPct ?? null)}
          </Text>
        ) : null}
      </XStack>
      {spark && spark.filter((v) => Number.isFinite(v)).length >= 2 ? <Sparkline points={spark} color={sparkColor ?? (SERIES[0] as string)} /> : null}
    </YStack>
  )
}
