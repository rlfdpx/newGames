// Deterministic UUID for an email address (RFC 4122 v5, SHA-1, DNS namespace).
//
// Used only as a fallback: if the `people` table hasn't been created yet, we
// still need a stable `sub` for the minted Supabase JWT. Because it's derived
// from the email, the same person keeps the same id across sessions, and it
// stays consistent with nothing else needing to exist first.

import { createHash } from 'crypto'

const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

export function uuidForEmail(email: string): string {
  const ns = Buffer.from(NAMESPACE_DNS.replace(/-/g, ''), 'hex')
  const hash = createHash('sha1')
    .update(Buffer.concat([ns, Buffer.from(email.toLowerCase(), 'utf8')]))
    .digest()

  const bytes = Buffer.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6] & 0x0f) | 0x50 // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // RFC 4122 variant

  const hex = bytes.toString('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

/** 'wesly.seide@lotomobil.com' -> 'Wesly Seide'. Starting point for a new row. */
export function nameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ') || email
}
