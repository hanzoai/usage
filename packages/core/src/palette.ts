// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// The ONE usage palette + theme tokens, dependency-free so every surface can reach
// it: the @hanzo/gui marks (marks.tsx, shipped as source) AND the DOM dashboard
// (dashboard.tsx, compiled into dist) render the same colours.
//
// Colours resolve through the standard Hanzo CSS custom properties (--foreground,
// --muted-foreground, --card, --border, --radius) with literal fallbacks, so a
// surface that loads `@hanzo/ui/theme.css` themes automatically and one that does
// not still renders legibly. No Tailwind, no utility classes, no host contract.

/** Categorical series palette — dark+light legible. */
export const SERIES = ['#6ea8fe', '#7ee787', '#f0a868', '#c792ea', '#56d4c4', '#e879a6', '#d6c15a', '#8b9bb4'] as const
/** Neutral meter/track fill. */
export const TRACK = 'rgba(128,128,128,0.18)'
export const UP = '#7ee787'
export const DOWN = '#e5534b'
export const colorAt = (i: number): string => SERIES[i % SERIES.length] as string

/** Theme tokens (`@hanzo/ui/theme.css`) with standalone fallbacks. */
export const TOKEN = {
  fg: 'var(--foreground, #f4f4f5)',
  muted: 'var(--muted-foreground, #a1a1aa)',
  card: 'var(--card, rgba(128,128,128,0.06))',
  border: 'var(--border, rgba(128,128,128,0.25))',
  radius: 'var(--radius, 0.5rem)',
} as const
