'use client'

import { useState } from 'react'
import { GameRow } from '@/lib/supabaseClient'

const STATUSES = ['In Development', 'In QA', 'Released', 'On Hold', 'Cancelled']

type FormData = {
  game_name: string
  code_name: string
  overall_status: string
  release_date: string
  notes: string
  sort_order: number
}

const FIELD_STYLE: React.CSSProperties = {
  background: 'var(--nd-surface-raised)',
  border: '1px solid var(--nd-border-vis)',
  borderRadius: 4,
  color: 'var(--nd-text-primary)',
  fontFamily: 'Space Mono, monospace',
  fontSize: 13,
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
}

export default function GameForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: GameRow | null
  onSave: (data: Omit<GameRow, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
}) {
  // GameForm is remounted each time it's opened (see app/page.tsx and
  // app/game/[id]/page.tsx, which conditionally render it), so it's safe to
  // seed state directly from `initial` here instead of syncing via an effect.
  const [form, setForm] = useState<FormData>(() => initial ? {
    game_name: initial.game_name, code_name: initial.code_name ?? '',
    overall_status: initial.overall_status, release_date: initial.release_date ?? '',
    notes: initial.notes ?? '', sort_order: initial.sort_order,
  } : {
    game_name: '', code_name: '', overall_status: 'In Development',
    release_date: '', notes: '', sort_order: 0,
  })
  const [saving, setSaving] = useState(false)

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        game_name: form.game_name.trim(),
        code_name: form.code_name.trim() || null,
        overall_status: form.overall_status,
        release_date: form.release_date || null,
        notes: form.notes.trim() || null,
        sort_order: form.sort_order,
      })
    } finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div
        style={{
          background: 'var(--nd-surface)',
          border: '1px solid var(--nd-border-vis)',
          borderRadius: 12,
          padding: 24,
          width: '100%',
          maxWidth: 440,
        }}
      >
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <span className="nd-label" style={{ fontSize: 12 }}>
            {initial ? '[ Edit Game ]' : '[ New Game ]'}
          </span>
          <button className="nd-btn-ghost" onClick={onCancel}>[X]</button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Game Name *">
            <input required value={form.game_name} onChange={set('game_name')} style={FIELD_STYLE} placeholder="Game 6" />
          </Field>
          <Field label="Code Name">
            <input value={form.code_name} onChange={set('code_name')} style={FIELD_STYLE} placeholder="Internal name" />
          </Field>
          <Field label="Status">
            <select value={form.overall_status} onChange={set('overall_status')} style={FIELD_STYLE}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Release Date">
            <input type="date" value={form.release_date} onChange={set('release_date')} style={FIELD_STYLE} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={set('notes')} style={{ ...FIELD_STYLE, resize: 'none' }} rows={2} />
          </Field>

          <div className="flex gap-3 mt-2">
            <button type="submit" disabled={saving} className="nd-btn-primary flex-1">
              {saving ? '[Saving...]' : initial ? '[Save]' : '[Add Game]'}
            </button>
            <button type="button" onClick={onCancel} className="nd-btn-secondary flex-1">
              [Cancel]
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="nd-label">{label}</label>
      {children}
    </div>
  )
}
