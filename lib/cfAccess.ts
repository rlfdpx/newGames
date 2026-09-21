// Cloudflare Access JWT verification.
//
// Access puts a signed assertion on every request that reaches the app through
// the protected hostname — as the `Cf-Access-Jwt-Assertion` header, and as the
// `CF_Authorization` cookie. Verifying it here (not just trusting Cloudflare to
// be in front) is what makes the raw *.vercel.app URL useless: that URL never
// carries a valid assertion, so proxy.ts turns it away.

import { createRemoteJWKSet, jwtVerify } from 'jose'

export type AccessIdentity = {
  email: string
  /** Access's stable per-user id. Not the Supabase `sub` — that's people.id. */
  sub: string
}

export const ACCESS_COOKIE = 'CF_Authorization'
export const ACCESS_HEADER = 'cf-access-jwt-assertion'

/** Headers proxy.ts forwards to routes once an identity is established. */
export const USER_EMAIL_HEADER = 'x-user-email'
export const USER_SUB_HEADER = 'x-user-sub'

/**
 * Accepts `myteam`, `myteam.cloudflareaccess.com`, or the full https URL, since
 * the Cloudflare dashboard shows the team domain in more than one shape.
 */
export function teamOrigin(): string | null {
  const raw = (process.env.CF_ACCESS_TEAM_DOMAIN ?? '').trim().replace(/\/+$/, '')
  if (!raw) return null
  if (raw.startsWith('https://')) return raw
  if (raw.includes('.')) return `https://${raw}`
  return `https://${raw}.cloudflareaccess.com`
}

// createRemoteJWKSet caches the key set and refreshes it on unknown `kid`, so
// this is built once per runtime rather than per request.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function keySet(origin: string) {
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${origin}/cdn-cgi/access/certs`))
  return jwks
}

/**
 * In development there is no Cloudflare in front of `next dev`, so without an
 * escape hatch the whole app would 403 locally. Set DEV_USER_EMAIL in
 * .env.local to run as that person. Deliberately ignored in production builds.
 */
export function devIdentity(): AccessIdentity | null {
  if (process.env.NODE_ENV !== 'development') return null
  const email = process.env.DEV_USER_EMAIL?.trim()
  if (!email) return null
  return { email, sub: `dev-${email}` }
}

/** Reads the assertion from the header, falling back to the cookie. */
export function readAssertion(headerValue: string | null, cookieValue: string | undefined): string | null {
  return headerValue?.trim() || cookieValue?.trim() || null
}

/**
 * Returns the verified identity, or null for anything unverifiable — a missing
 * token, a bad signature, the wrong application, an expired assertion.
 */
export async function verifyAccessJwt(token: string | null): Promise<AccessIdentity | null> {
  const origin = teamOrigin()
  const aud = process.env.CF_ACCESS_AUD?.trim()
  if (!token || !origin || !aud) return null

  try {
    const { payload } = await jwtVerify(token, keySet(origin), {
      issuer: origin,
      audience: aud,
    })
    const email = typeof payload.email === 'string' ? payload.email : null
    if (!email || !payload.sub) return null
    return { email: email.toLowerCase(), sub: payload.sub }
  } catch {
    return null
  }
}

/**
 * True once the Access env vars are present. When they're absent — a preview
 * deploy that hasn't been configured yet — the gate stays closed rather than
 * failing open.
 */
export function accessConfigured(): boolean {
  return Boolean(teamOrigin() && process.env.CF_ACCESS_AUD?.trim())
}
