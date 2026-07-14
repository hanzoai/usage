// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// React entry — the `useUsage` store hook plus the canonical <UsagePanel>.

import { useSyncExternalStore } from 'react'
import type { UsageStore, UsageStoreState } from './store'

export const useUsage = (store: UsageStore): UsageStoreState =>
  useSyncExternalStore(
    (onChange) => store.subscribe(onChange),
    () => store.getState(),
    () => store.getState(),
  )

// <UsagePanel> + sub-parts (UsageOverview / UsageChart / UsageBreakdown / UsageActivity).
export * from './panel'
