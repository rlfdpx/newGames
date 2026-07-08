'use client'

import { useState, useEffect } from 'react'
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

export default function GameForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: GameRow | null
  onSave: (data: Omit<GameRow, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<FormData>({
    game_name: '',
    code_name: '',
    overall_status: 'In Development',
    release_date: '',
    notes: '',
    sort_order: 0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        game_name: initial.game_name,
        code_name: initial.code_name ?? '',
        overall_status: initial.overall_status,
        release_date: initial.release_date ?? '',
        notes: initial.notes ?? '',
        sort_order: initial.sort_order,
      })
    }
  }, [initial])

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {initial ? 'Edit Game' : 'Add Game'}
        </h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Game Name *">
            <input required value={form.game_name} onChange={set('game_name')} className={INPUT} placeholder="e.g. Game 6" />
          </Field>
          <Field label="Code Name">
            <input value={form.code_name} onChange={set('code_name')} className={INPUT} placeholder="Internal name" />
          </Field>
          <Field label="Status">
            <select value={form.overall_status} onChange={set('overall_status')} className={INPUT}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Release Date">
            <input type="date" value={form.release_date} onChange={set('release_date')} className={INPUT} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={set('notes')} className={`${INPUT} resize-none`} rows={2} />
          </Field>
          <div className="flex gap-3 mt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 transition-colors">
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Game'}
            </button>
            <button type="button" onClick={onCancel} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const INPUT = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      {children}
    </div>
  )
}
