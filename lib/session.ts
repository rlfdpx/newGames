// Session token cache.
//
// supabase-js calls `accessToken` on every request and every realtime
// reconnect, so this has to be cheap. The token is held in module scope until
// shortly before it expires, and concurrent callers share one in-flight fetch
// rather than each hitting /api/session.

import type { Person } from './supabaseClient'

export type SessionPayload = {
  token: string | null
  expiresAt: number | null
  person: Person
}

/** Refresh this long before the real expiry, to cover clock skew and latency. */
const REFRESH_MARGIN_SECONDS = 120

let cached: SessionPayload | null = null
let inFlight: Promise<SessionPayload | null> | null = null

function stillFresh(session: SessionPayload | null): session is SessionPayload {
  if (!session?.token || !session.expiresAt) return false
  return session.expiresAt - REFRESH_MARGIN_SECONDS > Date.now() / 1000
}

async function load(): Promise<SessionPayload | null> {
  try {
    const res = await fetch('/api/session', { cache: 'no-store' })
    if (!res.ok) return null
    const body = (await res.json()) as SessionPayload
    cached = body
    return body
  } catch {
    return null
  } finally {
    inFlight = null
  }
}

/** Fetches the session, reusing a cached token while it's still valid. */
export function fetchSession(force = false): Promise<SessionPayload | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (!force && stillFresh(cached)) return Promise.resolve(cached)
  if (!inFlight) inFlight = load()
  return inFlight
}

/**
 * Handed to createClient. Returning null is deliberate rather than throwing:
 * supabase-js then falls back to the anon key, which is exactly what should
 * happen while RLS is still open and SUPABASE_JWT_SECRET may be unset.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await fetchSession()
  return session?.token ?? null
}

/** The cached person, if a session has already been loaded. */
export function cachedPerson(): Person | null {
  return cached?.person ?? null
}
