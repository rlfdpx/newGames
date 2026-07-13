import Link from 'next/link'

const TEAMS = [
  { slug: 'haiti',   name: 'Haiti Lotomobil', label: 'HT' },
  { slug: 'nigeria', name: 'Nigeria',          label: 'NG' },
  { slug: 'ghana',   name: 'Ghana',            label: 'GH' },
]

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--nd-bg)' }}
    >
      <div className="w-full max-w-xl px-4">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="nd-label mb-3" style={{ letterSpacing: '0.15em', color: 'var(--nd-text-secondary)' }}>
            GAMES LAUNCH TRACKER HT
          </div>
          <div
            className="nd-doto"
            style={{ fontSize: 64, lineHeight: 1, color: 'var(--nd-text-display)', letterSpacing: '-0.02em' }}
          >
            TEAMS
          </div>
        </div>

        {/* Team cards */}
        <div className="flex flex-col gap-3">
          {TEAMS.map(t => (
            <Link
              key={t.slug}
              href={`/team/${t.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 28px',
                background: 'var(--nd-surface)',
                border: '1px solid var(--nd-border)',
                borderRadius: 12,
                textDecoration: 'none',
              }}
            >
              <div className="flex items-center gap-5">
                <span
                  className="nd-doto"
                  style={{ fontSize: 36, lineHeight: 1, color: 'var(--nd-text-display)', letterSpacing: '-0.02em', minWidth: 48 }}
                >
                  {t.label}
                </span>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-space-grotesk)',
                    fontSize: 18, fontWeight: 500,
                    color: 'var(--nd-text-display)',
                  }}>
                    {t.name}
                  </div>
                  <div className="nd-label mt-1" style={{ color: 'var(--nd-text-disabled)' }}>
                    Games Launch Tracker
                  </div>
                </div>
              </div>
              <span className="nd-mono" style={{ fontSize: 18, color: 'var(--nd-text-disabled)' }}>→</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
