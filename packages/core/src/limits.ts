// Copyright (c) 2026 Hanzo AI Inc. MIT License.
//
// The plan's usage limits — `GET /v1/ai/limits`, the one policy cloud enforces
// on every AI call (hanzo-inc/cloud apps/ai/limits) — and the one choice an org
// makes about them: whether to keep paying from credits once included usage is
// spent (`PUT /v1/ai/limits`, org admins only).
//
// Both take the gateway origin (`base`) and the request headers — the bearer
// that names the subject and `X-Org-Id` the organization (@hanzo/iam's
// `scope()`) — so nothing here reads a session or an address of its own. What
// the answer means on a screen (shares, a banner over the composer, the plan's
// name) is the caller's: @hanzo/ui holds the limits for a page, @hanzo/build
// words them.

/** A refusal from the limits route, carrying the HTTP status. */
export class LimitsError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'LimitsError'
    this.status = status
  }
}

const LIMITS_PATH = '/v1/ai/limits'

const origin = (base: string): string => base.replace(/\/+$/, '')

/**
 * The limits for whoever `headers` name, in the organization they name, as the
 * server answers them. The shape is the server's and is read by the caller
 * (@hanzo/ui's `useLimits`), so it is passed on untouched; a refusal throws.
 */
export async function limits(base: string, headers: Record<string, string>, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(`${origin(base)}${LIMITS_PATH}`, { headers, signal })
  if (!res.ok) throw new LimitsError(`Limits answered ${res.status}`, res.status)
  return res.json()
}

/** The server's own words in an error body: `{error: "…"}`, `{error: {message}}` or `{message}`. */
function words(body: unknown): string {
  const b = (body ?? {}) as { error?: { message?: unknown } | string; message?: unknown }
  if (typeof b.error === 'string') return b.error
  if (typeof b.error?.message === 'string') return b.error.message
  return typeof b.message === 'string' ? b.message : ''
}

/**
 * Turn on or off the org's choice to keep paying from credits once included
 * usage runs out. A refusal throws with the server's own words — a member who
 * is not an admin is told why — and its status.
 */
export async function credits(base: string, headers: Record<string, string>, on: boolean): Promise<void> {
  const res = await fetch(`${origin(base)}${LIMITS_PATH}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ creditsAfterAllowance: on }),
  })
  if (res.ok) return
  const said = words(await res.json().catch(() => null))
  throw new LimitsError(
    said || (res.status === 403 ? 'Only an organization admin can turn on credits.' : `Credits answered ${res.status}`),
    res.status,
  )
}
