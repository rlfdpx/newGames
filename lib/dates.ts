// Parse D/M/YYYY or DD/MM/YYYY → ISO YYYY-MM-DD (returns null if blank/invalid)
export function parseDMY(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.trim()
  if (!s) return null
  const parts = s.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map((p) => p.trim().padStart(2, '0'))
  if (!d || !m || !y) return null
  return `${y}-${m}-${d}`
}

// Returns today's date as YYYY-MM-DD string (local time)
export function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Days between two ISO date strings (positive = b is later)
export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
