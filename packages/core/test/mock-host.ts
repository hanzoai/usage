// Copyright (c) 2026 Hanzo AI Inc. MIT License.
import type { HttpRequest, HttpResponse, UsageHost } from '../src/host.js'

export interface MockHostSetup {
  files?: Record<string, string>
  responses?: Record<string, HttpResponse | ((req: HttpRequest) => HttpResponse)>
  env?: Record<string, string>
  now?: string
}

export interface MockHost extends UsageHost {
  files: Map<string, string>
  requests: HttpRequest[]
}

export const mockHost = (setup: MockHostSetup = {}): MockHost => {
  const files = new Map(Object.entries(setup.files ?? {}))
  const requests: HttpRequest[] = []
  return {
    files,
    requests,
    async readTextFile(path) {
      return files.get(path)
    },
    async listDir(path) {
      const prefix = `${path}/`
      const names = new Set<string>()
      for (const key of files.keys()) {
        if (key.startsWith(prefix)) names.add(key.slice(prefix.length).split('/')[0]!)
      }
      return [...names]
    },
    async writeTextFile(path, contents) {
      files.set(path, contents)
    },
    async http(req) {
      requests.push(req)
      const handler = setup.responses?.[req.url]
      if (!handler) return { status: 404, headers: {}, text: 'not mocked' }
      return typeof handler === 'function' ? handler(req) : handler
    },
    env: (name) => setup.env?.[name],
    homeDir: () => '/home/z',
    now: () => new Date(setup.now ?? '2026-07-07T12:00:00Z'),
  }
}

export const json = (body: unknown): HttpResponse => ({
  status: 200,
  headers: { 'content-type': 'application/json' },
  text: JSON.stringify(body),
})
