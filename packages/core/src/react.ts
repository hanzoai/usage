// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// React binding — one hook, no extra state library.

import { useSyncExternalStore } from 'react'
import type { UsageStore, UsageStoreState } from './store.js'

export const useUsage = (store: UsageStore): UsageStoreState =>
  useSyncExternalStore(
    (onChange) => store.subscribe(onChange),
    () => store.getState(),
    () => store.getState(),
  )
