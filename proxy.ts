// Auth gate. Next 16 renamed `middleware` to `proxy`; it runs on the Node.js
// runtime by default, so `jose` works here without an edge-runtime build.
//
// Every request must carry a valid Cloudflare Access assertion. Cloudflare
// already enforces this on the protected hostname — re-checking it here closes
// the hole that the app is also reachable at its bare *.vercel.app address,
// which Cloudflare never sees.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  ACCESS_COOKIE,
  ACCESS_HEADER,
  USER_EMAIL_HEADER,
  USER_SUB_HEADER,
  accessConfigured,
  devIdentity,
  readAssertion,
  verifyAccessJwt,
} from '@/lib/cfAccess'

function denied(): NextResponse {
  const body = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign in required</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0f0f0f; color:#f5f5f5; font-family:ui-sans-serif,system-ui,sans-serif; }
  .box { text-align:center; padding:32px; max-width:420px; }
  h1 { font-size:18px; font-weight:500; margin:0 0 12px; }
  p  { font-size:14px; line-height:1.6; color:#9a9a9a; margin:0; }
</style>
<div class="box">
  <h1>Sign in required</h1>
  <p>This dashboard is only reachable through its Cloudflare Access address.
     Open the team link and sign in with your work Google account.</p>
</div>`
  return new NextResponse(body, {
    status: 403,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export async function proxy(request: NextRequest) {
  // Missing env vars and a forged token both end in a 403, which is correct but
  // indistinguishable from the outside. Say so in the server log, so "the whole
  // team is locked out" is a one-line diagnosis in Vercel's logs rather than a
  // guess. Never surfaced to the client.
  if (!devIdentity() && !accessConfigured()) {
    console.error(
      '[proxy] CF_ACCESS_TEAM_DOMAIN and/or CF_ACCESS_AUD are not set — ' +
      'every request will be denied until they are configured.',
    )
  }

  const identity =
    devIdentity() ??
    (await verifyAccessJwt(
      readAssertion(
        request.headers.get(ACCESS_HEADER),
        request.cookies.get(ACCESS_COOKIE)?.value,
      ),
    ))

  if (!identity) return denied()

  // Rebuild the identity headers from the verified token only. Anything the
  // client sent under these names is dropped first — otherwise a request could
  // simply claim `x-user-email: someone.else@…` and /api/session would mint a
  // token for them.
  const headers = new Headers(request.headers)
  headers.delete(USER_EMAIL_HEADER)
  headers.delete(USER_SUB_HEADER)
  headers.set(USER_EMAIL_HEADER, identity.email)
  headers.set(USER_SUB_HEADER, identity.sub)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: [
    // Everything except Next's own static output and the public/ assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
