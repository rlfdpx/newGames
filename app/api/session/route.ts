// Exchanges a verified Cloudflare Access identity for a short-lived Supabase
// JWT, so the browser's supabase-js client acts as an authenticated user rather
// than as the anon key that ships in the bundle.
//
// Reaching this route at all requires passing proxy.ts, which rebuilds the
// x-user-email header from a cryptographically verified assertion and drops any
// client-supplied copy. So the header is trustworthy here and nowhere else.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'
import { USER_EMAIL_HEADER, teamOrigin } from '@/lib/cfAccess'
import { uuidForEmail, nameFromEmail } from '@/lib/personId'
import type { Person } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

const TOKEN_TTL_SECONDS = 60 * 60 // 1 hour

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Access's JWT carries the email but not the display name. The identity
 * endpoint has the Google profile name — worth one call, but only when we're
 * creating a person for the first time. Never fatal.
 */
async function googleName(cookie: string | null): Promise<string | null> {
  const origin = teamOrigin()
  if (!origin || !cookie) return null
  try {
    const res = await fetch(`${origin}/cdn-cgi/access/get-identity`, {
      headers: { cookie },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = (await res.json()) as { name?: unknown }
    return typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null
  } catch {
    return null
  }
}

/**
 * Finds or creates the person. Returns null if the `people` table isn't there
 * yet — the caller falls back to an email-derived identity so the app keeps
 * working between deploying this code and running 001_people.sql.
 */
async function resolvePerson(email: string, cookie: string | null): Promise<Person | null> {
  const db = serviceClient()
  if (!db) return null

  const { data: existing } = await db
    .from('people')
    .select('id, email, display_name, aliases, is_admin')
    .ilike('email', email)
    .maybeSingle()

  if (existing) return existing as Person

  const { data: created, error } = await db
    .from('people')
    .insert({
      email,
      display_name: (await googleName(cookie)) ?? nameFromEmail(email),
    })
    .select('id, email, display_name, aliases, is_admin')
    .single()

  if (error || !created) return null
  return created as Person
}

export async function GET(request: Request) {
  const email = request.headers.get(USER_EMAIL_HEADER)
  if (!email) {
    return NextResponse.json({ error: 'No identity' }, { status: 401 })
  }

  const secret = process.env.SUPABASE_JWT_SECRET
  const person = await resolvePerson(email, request.headers.get('cookie'))

  // Fallback identity keeps the UI populated even if `people` doesn't exist yet
  // or the service-role key is missing from this environment.
  const identity: Person = person ?? {
    id: uuidForEmail(email),
    email,
    display_name: nameFromEmail(email),
    aliases: [],
    is_admin: false,
  }

  if (!secret) {
    // No signing key configured: the client falls back to the anon key. This is
    // the pre-Step-5 state, where RLS is still open and that still works.
    return NextResponse.json(
      { token: null, expiresAt: null, person: identity },
      { headers: { 'cache-control': 'no-store' } },
    )
  }

  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  const token = await new SignJWT({
    email: identity.email,
    role: 'authenticated',
    app_metadata: { provider: 'cloudflare-access' },
    user_metadata: { display_name: identity.display_name },
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(identity.id)
    .setAudience('authenticated')
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(secret))

  return NextResponse.json(
    { token, expiresAt, person: identity },
    { headers: { 'cache-control': 'no-store' } },
  )
}
