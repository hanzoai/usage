// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Node host — used by chat's Express API, console/app server routes, and CLIs.

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { homedir } from 'node:os'
import type { HttpRequest, HttpResponse, UsageHost } from '../host.js'

export const nodeHost: UsageHost = {
  async readTextFile(path) {
    try {
      return await readFile(path, 'utf8')
    } catch {
      return undefined
    }
  },
  async listDir(path) {
    try {
      return await readdir(path)
    } catch {
      return []
    }
  },
  async writeTextFile(path, contents) {
    // History persistence is best-effort: a non-directory parent (e.g. when
    // ~/.config/hanzo is a file) makes mkdir throw ENOTDIR — never let that
    // break usage tracking, which works fine from memory.
    try {
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, contents, 'utf8')
    } catch {
      /* best-effort — sparkline history is optional */
    }
  },
  async http(req: HttpRequest): Promise<HttpResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), req.timeoutMs ?? 30_000)
    try {
      const res = await fetch(req.url, {
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
  env: (name) => process.env[name],
  homeDir: () => homedir(),
  now: () => new Date(),
}
