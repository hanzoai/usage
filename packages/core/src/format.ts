// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Usage formatters — the ONE place spend, counts, and deltas are rendered as text.
// Pure + headless (reused by the React panel and any non-React surface); harvested
// from the former @hanzo/ui usage kit so there is a single implementation.

/** Money from USD cents: `$12.34`, compacting to `$1.2K` past ten thousand dollars. */
export function formatCents(cents: number): string {
  const d = (Number.isFinite(cents) ? cents : 0) / 100
  const abs = Math.abs(d)
  if (abs >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`
  if (abs >= 10_000) return `$${(d / 1_000).toFixed(1)}K`
  return `$${d.toFixed(2)}`
}

/** A full monetary amount in a currency, e.g. `$12.34` / `12.34 USD` fallback. */
export function formatCurrency(value: number, currencyCode = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`
  }
}

/** Compact count (1.2K / 3.4M / 5.6B) for token/request totals; `—` when not finite. */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(Math.round(n))
}

/** A signed percent label for a delta, e.g. `+18%` / `-4%` / `new` (null == no basis). */
export function formatDeltaPct(pct: number | null): string {
  if (pct == null) return 'new'
  const r = Math.round(pct)
  return `${r > 0 ? '+' : ''}${r}%`
}

/** Direction of a delta for tone/arrow: rising, falling, or flat/unknown. */
export function deltaDirection(pct: number | null): 'up' | 'down' | 'flat' {
  if (pct == null || Math.round(pct) === 0) return 'flat'
  return pct > 0 ? 'up' : 'down'
}

/** Format a bucket timestamp for a chart axis: `14:00` for hours, `Jul 3` for days. */
export function formatBucket(iso: string, interval: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  if (interval === 'hour') return `${String(d.getUTCHours()).padStart(2, '0')}:00`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** `updated 2m ago` from a real timestamp, or null when there is none/unparseable. */
export function updatedLabel(t?: string | Date): string | null {
  if (t == null) return null
  const ms = typeof t === 'string' ? Date.parse(t) : t.getTime()
  if (!Number.isFinite(ms)) return null
  const mins = Math.floor((Date.now() - ms) / 60000)
  if (mins < 1) return 'updated just now'
  if (mins < 60) return `updated ${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `updated ${h}h ago`
  return `updated ${Math.floor(h / 24)}d ago`
}
