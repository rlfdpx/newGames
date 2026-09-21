# Cloudflare Access setup

Everything in this file is done by hand in the Cloudflare, Google, Vercel and
Supabase dashboards. The app code is already on the `feat/cloudflare-access-auth`
branch and does nothing until steps 1–7 are finished.

Order matters. Steps 1–7 stand up login; step 8 is the one that can break the
live dashboard, so it comes last and has its own checklist.

---

## Why there are two gates

Cloudflare Access protects a **hostname**. It cannot protect
`new-games-nine.vercel.app`, and it cannot protect Supabase's REST API — the
anon key in the JS bundle talks to Supabase directly, with Cloudflare nowhere in
the path.

So the Access assertion is verified a second time inside the app
([proxy.ts](../proxy.ts)), which closes the `.vercel.app` bypass, and exchanged
for a short-lived Supabase JWT ([app/api/session/route.ts](../app/api/session/route.ts)),
which closes the anon-key bypass once step 8 is run.

---

## 1. A domain on Cloudflare

None of `lotomobil.com`, `numba.app`, `safitek.net`, or `aeglefinancials.com` is
on Cloudflare today — the first two use AWS Route 53, the other two GoDaddy, and
all four run Google Workspace mail. Access needs the app's hostname proxied
through Cloudflare, so you need a zone.

**Recommended:** register a new domain in Cloudflare Registrar (~$10/yr) and
serve the dashboard at something like `tracker.<newdomain>`. Nothing about the
four existing zones changes, so there is no risk to live mail or DNS.

Moving `safitek.net`'s nameservers to Cloudflare is free and also works, but it
migrates that entire zone including its Google MX records. Only do that if the
zone is low-stakes.

> The hosting domain and the login domains are unrelated. Whatever domain the
> app is served from, the sign-in policy in step 5 still admits all four.

## 2. Point the hostname at Vercel

Cloudflare → your zone → **DNS**:

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `tracker` | `cname.vercel-dns.com` | **Proxied (orange cloud)** |

The orange cloud is what puts Cloudflare in the request path. Grey cloud means
Access never runs.

Then Vercel → the project → **Settings → Domains** → add `tracker.<domain>`.
Wait for it to verify and issue a certificate before continuing.

## 3. Google OAuth client

Google Cloud Console → **APIs & Services → Credentials → Create credentials →
OAuth client ID → Web application**.

- Authorized redirect URI: `https://<team>.cloudflareaccess.com/cdn-cgi/access/callback`
  (`<team>` is your Zero Trust team name, from Zero Trust → Settings → Custom Pages,
  or the subdomain shown in the Zero Trust dashboard URL.)

Keep the **client ID** and **client secret**.

## 4. Add Google as the login method

Zero Trust → **Settings → Authentication → Login methods → Add new → Google**.
Paste the client ID and secret, then **Test** it.

> Use the generic **Google** provider, *not* **Google Workspace**. The Workspace
> provider binds to a single admin domain and would cover only one of your four.
> Generic Google authenticates any Google account, and the policy in step 5 is
> what restricts who actually gets in.

## 5. The Access application

Zero Trust → **Access → Applications → Add an application → Self-hosted**.

- Application domain: `tracker.<domain>`
- Session duration: 24 hours is a reasonable default
- Identity providers: **Google only** — turn off One-time PIN

Policy:

- Action: **Allow**
- Include → **Emails ending in** → `@lotomobil.com`, `@safitek.net`,
  `@numba.app`, `@aeglefinancials.com`

**This policy is the enforcement.** Without it, any personal Gmail account would
satisfy the Google provider and get in.

Then copy two values from the application's overview:

- **Application Audience (AUD) tag** — a long hex string
- Your **team domain** — `<team>.cloudflareaccess.com`

## 6. The Supabase JWT secret

Supabase → **Settings → JWT Keys → Legacy JWT Secret**. Copy the value.

This project has already migrated to JWT Signing Keys, and the page warns that
the legacy secret is "used to only verify JSON Web Tokens". That warning is
about *signing* — Supabase no longer issues tokens with it. Verification is all
this app needs: the project's verification JWKS still carries the legacy secret
as a symmetric JWK precisely so HS256 tokens keep validating, which is what
[`/api/session`](../app/api/session/route.ts) mints. So HS256 works as-is.

> **Treat this secret like the service-role key.** Anyone holding it can sign a
> `role: service_role` token and read or write the whole database, RLS or no
> RLS. Never paste it into chat, a screenshot, or the repo — `.env.local` and
> Vercel's environment variables only.
>
> **There is no quick rotation for it.** Rotating creates a new asymmetric
> signing key; it does not change the legacy secret's value. The only way to
> invalidate the old value is to *revoke* it — and revoking it rejects every JWT
> signed with it, which is exactly what `/api/session` produces. So a leaked
> legacy secret cannot be cleaned up in isolation: it requires the ES256
> migration below, then revocation.

### The ES256 migration — how to retire the legacy secret

The legacy secret is deprecated, and Supabase's API-keys page invites you to
disable it. **Don't** — revoking it breaks sign-in, because `/api/session`
signs with it.

The durable replacement is Supabase Third-Party Auth, which requires
asymmetric tokens:

1. Generate an EC P-256 keypair. Private JWK → Vercel as `SESSION_SIGNING_KEY`.
2. Register the **public** JWK with the project via the Management API:
   `custom_jwks` on `/v1/projects/{ref}/config/auth/third-party-auth`. The
   dashboard has no generic-provider UI, but the API does — and `custom_jwks`
   takes the key inline, so there is no public JWKS endpoint to punch through
   the Access gate.
3. Change `/api/session` to sign ES256 with a `kid` and a matching `iss`.
4. Verify sign-in still works.
5. *Then* revoke the legacy JWT secret. The `anon`/`service_role` JWT-based keys
   must be disabled first — already true here, since this project uses the newer
   `sb_publishable_` / `sb_secret_` keys.

Do this if the legacy secret has ever been exposed, or before anyone revokes it
for unrelated reasons. It is not a blocker for launch, and step 8 below is worth
running regardless: step 8 stops the publishable key (which genuinely ships in
the JS bundle) from touching the database, a wider hole than the legacy secret.

## 7. Environment variables

Vercel → Settings → Environment Variables, for **Production and Preview**:

| Variable | Value |
|---|---|
| `CF_ACCESS_TEAM_DOMAIN` | `<team>.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | the AUD tag from step 5 |
| `SUPABASE_JWT_SECRET` | the JWT secret from step 6 |
| `SUPABASE_SERVICE_ROLE_KEY` | already in `.env.local`; add it to Vercel too |

### Create the `people` table

> **Paste the file's contents, not its path.** Supabase's SQL editor runs SQL,
> so `supabase/migrations/001_people.sql` on its own line gives you
> `ERROR: 42601: syntax error at or near "supabase"`. Open the file, select all,
> copy, paste.

From the repo root:

```sh
# macOS — puts the SQL on the clipboard, ready to paste into the SQL editor
pbcopy < supabase/migrations/001_people.sql
```

Then Supabase → **SQL Editor → New query** → paste → **Run**. It only creates the
`people` table; nothing existing is touched.

Optionally do the same with
[`001_people_seed.sql`](../supabase/migrations/001_people_seed.sql) to connect
teammates to the names already on their tasks. **Open it and replace the
placeholder emails first** — it ships with `@example.com` addresses. Skipping the
seed entirely is fine: anyone who signs in is auto-provisioned, they just start
with no aliases, so "My Tasks" only matches their exact display name.

### Local development

Cloudflare isn't in front of `next dev`, so add to `.env.local`:

```
DEV_USER_EMAIL=you@lotomobil.com
```

Without it every local route returns 403. The variable is ignored outside
`NODE_ENV=development`.

---

## Verify login works

1. Open `https://tracker.<domain>` → Google sign-in → the dashboard, with your
   name in the top right.
2. Open `https://new-games-nine.vercel.app` → **403**. If it loads, the env vars
   from step 7 didn't reach the deployment.
3. Sign in with a personal `@gmail.com` → denied. If it gets in, the policy in
   step 5 is wrong.
4. Edit a task in two browsers → realtime still syncs.
5. `https://tracker.<domain>/api/session` → JSON with a `token`. Paste it into
   jwt.io: `role` must be `authenticated`, `exp` about an hour out.

## 8. Lock the database — last, and separately

Only after everything above is verified. Paste the contents of
[`supabase/migrations/002_rls_authenticated.sql`](../supabase/migrations/002_rls_authenticated.sql)
into the SQL editor (`pbcopy < supabase/migrations/002_rls_authenticated.sql`).

Before running it, confirm the anon key currently works. This is a **terminal**
command (Terminal.app or the VS Code terminal), run from the repo root — not the
Supabase SQL editor. The first line loads the keys out of `.env.local`; without
it the `$…` variables are empty and you'll get a malformed-URL error:

```sh
cd "/Users/rlfdpx/Library/Mobile Documents/com~apple~CloudDocs/claude/NewGames/game-dashboard"
set -a && . ./.env.local && set +a

curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/games?select=id&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Baseline as of 2026-09-21 — a row comes back, which is the hole this migration
closes:

```
[{"id":"8cef358e-498d-43d5-a092-a6452afe55ff"}]
```

After running the migration, the same command must return `[]`. That empty array
is the proof the bundle-key hole is closed. Then reload the dashboard and edit a
task — it should still work, because the browser is now sending the minted JWT.

The rollback SQL is at the bottom of that migration file.

> Storage has its own policy system. If the `game-thumbnails` bucket is public,
> this migration does not change that — tighten it separately if you want
> thumbnails behind auth too.
