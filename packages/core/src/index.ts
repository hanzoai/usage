// Copyright (c) 2026 Hanzo AI Inc. MIT License.
export * from './types.js'
export * from './host.js'
export * from './provider.js'
export * from './store.js'
export { codexProvider } from './providers/codex.js'
export { claudeProvider } from './providers/claude.js'
export { hanzoProvider } from './providers/hanzo.js'

import type { ProviderDescriptor } from './provider.js'
import { codexProvider } from './providers/codex.js'
import { claudeProvider } from './providers/claude.js'
import { hanzoProvider } from './providers/hanzo.js'

/** All built-in providers, registry-style like CodexBar's descriptor registry. */
export const providerRegistry: Record<string, ProviderDescriptor> = {
  hanzo: hanzoProvider,
  codex: codexProvider,
  claude: claudeProvider,
}

export const allProviders: ProviderDescriptor[] = Object.values(providerRegistry)
