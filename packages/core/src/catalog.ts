// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Display catalog of every trackable AI provider — id, display name, brand
// color, and packaged icon path (white-on-transparent SVG under assets/).
// Fetch pipelines exist for a subset (see providerRegistry); the catalog is
// the full connectable surface for pickers, grids, and marketing.

export interface ProviderCatalogEntry {
  id: string
  name: string
  color?: string
  /** Path under `@hanzo/usage/assets/` when a packaged icon exists. */
  icon?: string
}

export const providerCatalog: ProviderCatalogEntry[] = [
  { id: 'hanzo', name: 'Hanzo', color: '#ff2d55' },
  { id: 'abacus', name: 'Abacus AI', icon: 'providers/abacus.svg' },
  { id: 'alibaba', name: 'Alibaba', icon: 'providers/alibaba.svg' },
  { id: 'alibabatokenplan', name: 'Alibaba Token Plan' },
  { id: 'amp', name: 'Amp', icon: 'providers/amp.svg' },
  { id: 'antigravity', name: 'Antigravity', icon: 'providers/antigravity.svg' },
  { id: 'augment', name: 'Augment', icon: 'providers/augment.svg' },
  { id: 'azureopenai', name: 'Azure OpenAI' },
  { id: 'bedrock', name: 'AWS Bedrock', color: '#ff9900', icon: 'providers/bedrock.svg' },
  { id: 'chutes', name: 'Chutes', icon: 'providers/chutes.svg' },
  { id: 'claude', name: 'Claude', icon: 'providers/claude.svg' },
  { id: 'clawrouter', name: 'ClawRouter', icon: 'providers/clawrouter.svg' },
  { id: 'codebuff', name: 'Codebuff', icon: 'providers/codebuff.svg' },
  { id: 'codex', name: 'Codex', icon: 'providers/codex.svg' },
  { id: 'commandcode', name: 'Command Code', icon: 'providers/commandcode.svg' },
  { id: 'copilot', name: 'Copilot', icon: 'providers/copilot.svg' },
  { id: 'crof', name: 'Crof', color: '#2eab94', icon: 'providers/crof.svg' },
  { id: 'crossmodel', name: 'CrossModel', icon: 'providers/crossmodel.svg' },
  { id: 'cursor', name: 'Cursor', icon: 'providers/cursor.svg' },
  { id: 'deepgram', name: 'Deepgram', icon: 'providers/deepgram.svg' },
  { id: 'deepseek', name: 'DeepSeek', color: '#527df0', icon: 'providers/deepseek.svg' },
  { id: 'devin', name: 'Devin', icon: 'providers/devin.svg' },
  { id: 'doubao', name: 'Doubao', icon: 'providers/doubao.svg' },
  { id: 'elevenlabs', name: 'ElevenLabs', color: '#ebebe6', icon: 'providers/elevenlabs.svg' },
  { id: 'factory', name: 'Droid', icon: 'providers/factory.svg' },
  { id: 'gemini', name: 'Gemini', icon: 'providers/gemini.svg' },
  { id: 'grok', name: 'Grok', icon: 'providers/grok.svg' },
  { id: 'groq', name: 'Groq', icon: 'providers/groq.svg' },
  { id: 'jetbrains', name: 'JetBrains AI', icon: 'providers/jetbrains.svg' },
  { id: 'kilo', name: 'Kilo', icon: 'providers/kilo.svg' },
  { id: 'kimi', name: 'Kimi', icon: 'providers/kimi.svg' },
  { id: 'kimik2', name: 'Kimi K2 (unofficial)' },
  { id: 'kiro', name: 'Kiro', icon: 'providers/kiro.svg' },
  { id: 'litellm', name: 'LiteLLM', icon: 'providers/litellm.svg' },
  { id: 'llmproxy', name: 'LLM Proxy', icon: 'providers/llmproxy.svg' },
  { id: 'manus', name: 'Manus', icon: 'providers/manus.svg' },
  { id: 'mimo', name: 'Xiaomi MiMo', icon: 'providers/mimo.svg' },
  { id: 'minimax', name: 'MiniMax', icon: 'providers/minimax.svg' },
  { id: 'mistral', name: 'Mistral', icon: 'providers/mistral.svg' },
  { id: 'moonshot', name: 'Moonshot / Kimi API' },
  { id: 'ollama', name: 'Ollama', icon: 'providers/ollama.svg' },
  { id: 'openai', name: 'OpenAI', color: '#0f826e' },
  { id: 'opencode', name: 'OpenCode', icon: 'providers/opencode.svg' },
  { id: 'opencodego', name: 'OpenCode Go', icon: 'providers/opencodego.svg' },
  { id: 'openrouter', name: 'OpenRouter', icon: 'providers/openrouter.svg' },
  { id: 'perplexity', name: 'Perplexity', icon: 'providers/perplexity.svg' },
  { id: 'poe', name: 'Poe', icon: 'providers/poe.svg' },
  { id: 'qoder', name: 'Qoder', icon: 'providers/qoder.svg' },
  { id: 'sakana', name: 'Sakana AI', color: '#2975db', icon: 'providers/sakana.svg' },
  { id: 'stepfun', name: 'StepFun', color: '#2196f2', icon: 'providers/stepfun.svg' },
  { id: 'synthetic', name: 'Synthetic', icon: 'providers/synthetic.svg' },
  { id: 't3chat', name: 'T3 Chat', icon: 'providers/t3chat.svg' },
  { id: 'venice', name: 'Venice', color: '#3399ff', icon: 'providers/venice.svg' },
  { id: 'vertexai', name: 'Vertex AI', icon: 'providers/vertexai.svg' },
  { id: 'warp', name: 'Warp', icon: 'providers/warp.svg' },
  { id: 'windsurf', name: 'Windsurf', icon: 'providers/windsurf.svg' },
  { id: 'zai', name: 'z.ai', icon: 'providers/zai.svg' },
  { id: 'zed', name: 'Zed', icon: 'providers/zed.svg' },
]

export const providerCatalogById: Record<string, ProviderCatalogEntry> =
  Object.fromEntries(providerCatalog.map((p) => [p.id, p]))
