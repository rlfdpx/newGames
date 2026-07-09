'use client'

import { useState, useRef } from 'react'
import { TaskRow as TRow } from '@/lib/supabaseClient'
import { isTaskOverdue } from '@/lib/derive'
import { formatDate } from '@/lib/dates'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed']
const PRIORITY_OPTIONS = ['', 'High', 'Medium', 'Low']

const PRIORITY_COLORS: Record<string, string> = {
  High:   'text-red-600 dark:text-red-400',
  Medium: 'text-amber-600 dark:text-amber-400',
  Low:    'text-gray-400 dark:text-gray-500',
}

const STATUS_COLORS: Record<string, string> = {
  'Completed':  'text-green-600 dark:text-green-400',
  'In Progress':'text-blue-600 dark:text-blue-400',
  'Not Started':'text-gray-400 dark:text-gray-500',
}

// Single editable cell — shows value, click to edit, blur/Enter to save
function EditableCell({
  value,
  onSave,
  placeholder = '—',
  type = 'text',
  className = '',
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  type?: 'text' | 'date'
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const commit = () => {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        className={`w-full bg-white dark:bg-gray-800 border border-blue-400 rounded px-1.5 py-0.5 text-sm focus:outline-none ${className}`}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Click to edit"
      className={`cursor-pointer rounded px-1 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors ${!value ? 'text-gray-300 dark:text-gray-600 italic' : ''} ${className}`}
    >
      {value || placeholder}
    </span>
  )
}

function SelectCell({
  value,
  options,
  onSave,
  colorMap = {},
  className = '',
}: {
  value: string
  options: string[]
  onSave: (v: string) => void
  colorMap?: Record<string, string>
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onSave(e.target.value)}
      className={`bg-transparent focus:outline-none cursor-pointer rounded px-1 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors text-sm ${colorMap[value] ?? 'text-gray-400'} ${className}`}
    >
      {options.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
    </select>
  )
}

export default function TaskRow({
  task,
  onUpdate,
  onDelete,
}: {
  task: TRow
  onUpdate: (id: string, data: Partial<TRow>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const overdue = isTaskOverdue(task)
  const save = (field: keyof TRow) => (raw: string) => {
    const value = raw.trim() || null
    onUpdate(task.id, { [field]: value } as Partial<TRow>)
  }

  return (
    <tr className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors group ${overdue ? 'bg-red-50/40 dark:bg-red-950/10' : ''}`}>
      {/* Task name */}
      <td className="px-3 py-2 min-w-[160px]">
        <div className="flex items-center gap-1.5">
          <EditableCell
            value={task.name}
            onSave={(v) => v.trim() && onUpdate(task.id, { name: v.trim() })}
            className="font-medium text-gray-800 dark:text-gray-200 flex-1"
          />
          {overdue && <span className="text-xs text-red-500 shrink-0">overdue</span>}
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-2">
        <SelectCell
          value={task.status}
          options={STATUS_OPTIONS}
          onSave={(v) => onUpdate(task.id, { status: v })}
          colorMap={STATUS_COLORS}
          className="font-medium text-xs"
        />
      </td>

      {/* Assignee */}
      <td className="px-3 py-2 min-w-[100px]">
        <EditableCell
          value={task.assignee ?? ''}
          onSave={save('assignee')}
          placeholder="Assignee"
          className="text-sm text-gray-500 dark:text-gray-400"
        />
      </td>

      {/* Priority */}
      <td className="px-3 py-2">
        <SelectCell
          value={task.priority ?? ''}
          options={PRIORITY_OPTIONS}
          onSave={(v) => onUpdate(task.id, { priority: v || null })}
          colorMap={PRIORITY_COLORS}
          className="text-xs font-medium"
        />
      </td>

      {/* Start date */}
      <td className="px-3 py-2">
        <EditableCell
          value={task.start_date ?? ''}
          onSave={save('start_date')}
          placeholder="Start"
          type="date"
          className="text-xs text-gray-400"
        />
      </td>

      {/* End date */}
      <td className="px-3 py-2">
        <EditableCell
          value={task.end_date ?? ''}
          onSave={save('end_date')}
          placeholder="End"
          type="date"
          className="text-xs text-gray-400"
        />
      </td>

      {/* Notes */}
      <td className="px-3 py-2 max-w-[200px]">
        <EditableCell
          value={task.notes ?? ''}
          onSave={save('notes')}
          placeholder="Notes"
          className="text-xs text-gray-400 truncate block"
        />
      </td>

      {/* Delete */}
      <td className="px-3 py-2">
        <button
          onClick={() => confirm(`Delete "${task.name}"?`) && onDelete(task.id)}
          className="text-gray-200 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs px-1"
        >
          ✕
        </button>
      </td>
    </tr>
  )
}
