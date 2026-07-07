// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Tauri host — used by hanzo desktop and the hanzo app launcher. Requires the
// fs + http plugins with scope covering the provider config paths
// (~/.codex, ~/.claude, ~/.hanzo) and the provider API domains.

import type { UsageHost } from '../host.js'

type TauriFs = {
  readTextFile(path: string): Promise<string>
  readDir(path: string): Promise<Array<{ name: string }>>
  writeTextFile(path: string, contents: string): Promise<void>
  mkdir(path: string, opts?: { recursive?: boolean }): Promise<void>
}

/**
 * Build a UsageHost from Tauri plugin modules. Modules are passed in (not
 * imported) so this file stays dependency-free for web/Node bundles:
 *
 *   import * as fs from '@tauri-apps/plugin-fs'
 *   import { fetch } from '@tauri-apps/plugin-http'
 *   import { homeDir } from '@tauri-apps/api/path'
 *   const host = await createTauriHost({ fs, fetch, homeDir })
 */
export const createTauriHost = async (deps: {
  fs: TauriFs
  fetch: typeof fetch
  homeDir: () => Promise<string>
}): Promise<UsageHost> => {
  const home = (await deps.homeDir()).replace(/\/$/, '')
  return {
    async readTextFile(path) {
      try {
        return await deps.fs.readTextFile(path)
      } catch {
        return undefined
      }
    },
    async listDir(path) {
      try {
        return (await deps.fs.readDir(path)).map((e) => e.name)
      } catch {
        return []
      }
    },
    async writeTextFile(path, contents) {
      const dir = path.slice(0, path.lastIndexOf('/'))
      try {
        await deps.fs.mkdir(dir, { recursive: true })
      } catch {
        // exists
      }
      await deps.fs.writeTextFile(path, contents)
    },
    async http(req) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), req.timeoutMs ?? 30_000)
      try {
        const res = await deps.fetch(req.url, {
          method: req.method ?? 'GET',
          headers: req.headers,
          body: req.body,
          signal: controller.signal,
        })
        const headers: Record<string, string> = {}
        res.headers.forEach((v, k) => {
          headers[k] = v
        })
        return { status: res.status, headers, text: await res.text() }
      } finally {
        clearTimeout(timeout)
      }
    },
    env: () => undefined,
    homeDir: () => home,
    now: () => new Date(),
  }
}
