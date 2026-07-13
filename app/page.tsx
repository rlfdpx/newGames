'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAllTeamSettings } from '@/lib/useTeamSettings'
import ThemeToggle from '@/components/ThemeToggle'

const TEAMS = [
  { slug: 'haiti',   label: 'HT' },
  { slug: 'nigeria', label: 'NG' },
  { slug: 'ghana',   label: 'GH' },
]

function InlineEdit({
  value, onSave, placeholder, style,
}: { value: string; onSave: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    setEditing(false)
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim())
    else setDraft(value)
  }

  if (editing) return (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') { setDraft(value); setEditing(false) }
      }}
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--nd-interactive)',
        outline: 'none',
        color: 'inherit',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        letterSpacing: 'inherit',
        width: '100%',
        padding: '2px 0',
        ...style,
      }}
    />
  )

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Click to edit"
      style={{ cursor: 'pointer', ...style }}
    >
      {value || <span style={{ color: 'var(--nd-text-disabled)' }}>{placeholder}</span>}
    </span>
  )
}

export default function Home() {
  const { all, save, saving } = useAllTeamSettings(TEAMS.map(t => t.slug))

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--nd-bg)' }}
    >
      {/* Theme toggle — top right */}
      <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 10 }}>
        <ThemeToggle />
      </div>

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
          {TEAMS.map(t => {
            const s = all[t.slug]
            return (
              <div
                key={t.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 28px',
                  background: 'var(--nd-surface)',
                  border: '1px solid var(--nd-border)',
                  borderRadius: 12,
                  gap: 12,
                }}
              >
                <div className="flex items-center gap-5" style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className="nd-doto shrink-0"
                    style={{ fontSize: 36, lineHeight: 1, color: 'var(--nd-text-display)', letterSpacing: '-0.02em', minWidth: 52 }}
                  >
                    {t.label}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 500, color: 'var(--nd-text-display)' }}>
                      <InlineEdit
                        value={s?.display_name ?? t.slug}
                        onSave={v => save(t.slug, { display_name: v })}
                        placeholder="Team name"
                      />
                    </div>
                    <div className="nd-label mt-1" style={{ color: 'var(--nd-text-disabled)', fontSize: 11 }}>
                      <InlineEdit
                        value={s?.description ?? ''}
                        onSave={v => save(t.slug, { description: v || null })}
                        placeholder="Add a description..."
                        style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>
                </div>

                <Link
                  href={`/team/${t.slug}`}
                  className="nd-btn-primary shrink-0"
                  style={{ textDecoration: 'none', fontSize: 11, padding: '8px 18px' }}
                >
                  Open →
                </Link>
              </div>
            )
          })}
        </div>

        {saving && (
          <div className="nd-label text-center mt-4" style={{ color: 'var(--nd-text-disabled)' }}>
            [Saving...]
          </div>
        )}

      </div>
    </div>
  )
}
