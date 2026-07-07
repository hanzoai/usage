// Copyright (c) 2026 Hanzo AI Inc. MIT License.
// Host abstraction — the port of CodexBar's "Host APIs" concept. Providers never
// touch the filesystem, network, or environment directly; they go through a
// UsageHost so the same provider code runs in Node (chat/console/dev), Tauri
// (desktop/app), and tests.

export interface HttpRequest {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
}

export interface HttpResponse {
  status: number
  headers: Record<string, string>
  text: string
}

export interface UsageHost {
  /** Read a UTF-8 text file; returns undefined when missing/unreadable. */
  readTextFile(path: string): Promise<string | undefined>
  /** List directory entries (names, not paths); [] when missing. */
  listDir(path: string): Promise<string[]>
  /** Write a UTF-8 text file, creating parent directories. */
  writeTextFile(path: string, contents: string): Promise<void>
  http(req: HttpRequest): Promise<HttpResponse>
  env(name: string): string | undefined
  homeDir(): string
  now(): Date
}

/** Expand a leading `~/` against the host home directory. */
export const expandHome = (host: UsageHost, path: string): string =>
  path.startsWith('~/') ? `${host.homeDir()}/${path.slice(2)}` : path

export const readJsonFile = async <T>(
  host: UsageHost,
  path: string,
): Promise<T | undefined> => {
  const text = await host.readTextFile(expandHome(host, path))
  if (text === undefined) return undefined
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined
  }
}
