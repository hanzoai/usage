// Copyright (c) 2026 Hanzo AI Inc. MIT License.
export * from './types.js'
export * from './cloud-usage.js'
export * from './format.js'
export * from './host.js'
export * from './provider.js'
export * from './store.js'
export { codexProvider } from './providers/codex.js'
export { claudeProvider } from './providers/claude.js'
export { hanzoProvider } from './providers/hanzo.js'
export { groqProvider } from './providers/groq.js'
export { deepgramProvider } from './providers/deepgram.js'
export { byoProvider } from './providers/byo.js'
export * from './providers/api-token.js'
export {
  openrouterProvider,
  deepseekProvider,
  elevenlabsProvider,
  poeProvider,
  veniceProvider,
  chutesProvider,
  moonshotProvider,
  kimiProvider,
  kimik2Provider,
  zaiProvider,
  openaiProvider,
  litellmProvider,
  llmproxyProvider,
  minimaxProvider,
} from './providers/api-token-providers.js'

import type { ProviderDescriptor } from './provider.js'
import { codexProvider } from './providers/codex.js'
import { claudeProvider } from './providers/claude.js'
import { hanzoProvider } from './providers/hanzo.js'
import { groqProvider } from './providers/groq.js'
import { deepgramProvider } from './providers/deepgram.js'
import { byoProvider } from './providers/byo.js'
import {
  openrouterProvider,
  deepseekProvider,
  elevenlabsProvider,
  poeProvider,
  veniceProvider,
  chutesProvider,
  moonshotProvider,
  kimiProvider,
  kimik2Provider,
  zaiProvider,
  openaiProvider,
  litellmProvider,
  llmproxyProvider,
  minimaxProvider,
} from './providers/api-token-providers.js'

/** All built-in providers with a live fetch pipeline, registry-style like
 *  CodexBar's descriptor registry. Keys are the canonical provider ids. */
export const providerRegistry: Record<string, ProviderDescriptor> = {
  hanzo: hanzoProvider,
  codex: codexProvider,
  claude: claudeProvider,
  openai: openaiProvider,
  openrouter: openrouterProvider,
  deepseek: deepseekProvider,
  elevenlabs: elevenlabsProvider,
  deepgram: deepgramProvider,
  groq: groqProvider,
  poe: poeProvider,
  venice: veniceProvider,
  chutes: chutesProvider,
  moonshot: moonshotProvider,
  kimi: kimiProvider,
  kimik2: kimik2Provider,
  zai: zaiProvider,
  litellm: litellmProvider,
  llmproxy: llmproxyProvider,
  minimax: minimaxProvider,
  byo: byoProvider,
}

export const allProviders: ProviderDescriptor[] = Object.values(providerRegistry)

/** Provider ids that have a live native pipeline — UIs badge catalog entries
 *  as "In-app tracked" when their id is in this set (the rest are connect-only
 *  or tracked only via api.hanzo.ai cloud routing). */
export const trackedProviderIds: readonly string[] = Object.keys(providerRegistry)

export * from './catalog.js'
