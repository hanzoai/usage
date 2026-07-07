# Hanzo Usage

**One usage plane for every AI account you have.** Track rate limits, quotas,
credits, and spend across Codex, Claude, Hanzo, and 50+ AI providers — from the
macOS menu bar, the `dev` CLI, Hanzo Desktop, hanzo.app, hanzo.chat, and
console.hanzo.ai.

Hanzo Usage is the connective tissue of Hanzo's universal AI connector: link
your AI provider accounts once, see unified usage everywhere, and (optionally)
route inference through Hanzo Cloud for org-wide sharing, verification, and
analytics.

This repository is a fork of [CodexBar](https://github.com/steipete/CodexBar)
by Peter Steinberger (MIT). The Swift menu-bar app is inherited from upstream;
everything under `packages/` is new work © 2026 Hanzo AI Inc (MIT). See
`NOTICE`.

## Layout

| Path | What |
|------|------|
| `Sources/` | macOS menu-bar app + `codexbar` CLI (Swift, upstream) |
| `packages/core` | **`@hanzo/usage`** — headless TypeScript port of the provider engine. Runs in Node, Next.js, and Tauri. |
| `docs/` | Per-provider auth + endpoint documentation (upstream, still authoritative) |

## `@hanzo/usage` — the TypeScript core

```ts
import { UsageStore, allProviders } from '@hanzo/usage'
import { nodeHost } from '@hanzo/usage/node'   // or createTauriHost from '@hanzo/usage/tauri'

const store = new UsageStore({
  host: nodeHost,
  providers: allProviders,          // hanzo, codex, claude — registry-extensible
  historyDir: `${process.env.HOME}/.config/hanzo/usage/history`,
})
store.start()                       // 5-minute poll, CodexBar-compatible history files
store.subscribe(() => console.log(store.getState()))
```

React: `import { useUsage } from '@hanzo/usage/react'`.

### Provider model

Each provider is a `ProviderDescriptor` with an ordered pipeline of fetch
strategies (`oauth` → `web` → `cli` → `apiToken` → `localProbe`) that reuse
your existing logins — CLI OAuth token files, browser sessions, API keys —
exactly like the upstream app. Strategies fall back in priority order and
never ask for passwords.

Built-in providers:

- **hanzo** — commerce billing ledger (`/v1/billing/usage`) + local Hanzo Dev
  CLI rollout probe (token totals + rate-limit snapshots from
  `~/.codex`/`~/.hanzo` sessions)
- **codex** — `~/.codex/auth.json` OAuth → `chatgpt.com/backend-api/wham/usage`
- **claude** — `~/.claude/.credentials.json` OAuth →
  `api.anthropic.com/api/oauth/usage`, claude.ai web-session fallback

### Develop

```sh
cd packages/core
pnpm install
pnpm test    # vitest
pnpm build   # tsc → dist/
```

## macOS menu-bar app (upstream)

```sh
make build   # SwiftPM; see Package.swift
```

See upstream docs in `docs/` for the full 57-provider matrix, widgets,
and refresh-loop internals.

## License

MIT. Original work © 2026 Peter Steinberger (CodexBar); modifications and all
new work © 2026 Hanzo AI Inc. See `LICENSE` and `NOTICE`.
