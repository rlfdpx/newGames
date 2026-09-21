'use client'

import { useSession } from '@/lib/useSession'

export default function UserBadge() {
  const { person, loading } = useSession()

  if (loading || !person) return null

  return (
    <div className="flex items-center gap-2">
      <span
        className="nd-label"
        title={person.email}
        style={{ color: 'var(--nd-text-secondary)', fontSize: 11, letterSpacing: '0.08em' }}
      >
        {person.display_name}
      </span>
      {/* Cloudflare intercepts this path on the protected hostname and clears
          the Access session; it is not a route in this app. */}
      <a
        href="/cdn-cgi/access/logout"
        className="nd-btn-ghost"
        title="Sign out"
        style={{ fontSize: 11, letterSpacing: '0.08em', textDecoration: 'none' }}
      >
        [SIGN OUT]
      </a>
    </div>
  )
}
