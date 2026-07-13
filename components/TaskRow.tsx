'use client'

import { useState, useId } from 'react'
import { TaskRow as TRow } from '@/lib/supabaseClient'
import { isTaskOverdue } from '@/lib/derive'
import { formatDate } from '@/lib/dates'
import {
  TASK_STATUSES as STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS as PRIORITY_OPTIONS,
  TASK_STATUS_COLORS as STATUS_COLOR,
  TASK_PRIORITY_COLORS as PRIORITY_COLOR,
} from '@/lib/constants'

function InlineText({
  value, onSave, placeholder = '—', type = 'text', suggestions,
}: { value: string; onSave: (v: string) => void; placeholder?: string; type?: 'text' | 'date'; suggestions?: string[] }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const uid = useId()
  const listId = suggestions ? `dl-${uid}` : undefined

  const commit = () => { setEditing(false); if (draft !== value) onSave(draft) }

  if (editing) return (
    <>
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map(s => <option key={s} value={s} />)}
        </datalist>
      )}
      <input
        autoFocus
        type={type}
        list={listId}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        style={{
          background: 'var(--nd-surface-raised)',
          border: '1px solid var(--nd-interactive)',
          borderRadius: 2,
          color: 'var(--nd-text-primary)',
          fontFamily: 'Space Mono, monospace',
          fontSize: 12,
          padding: '2px 6px',
          outline: 'none',
          width: '100%',
        }}
      />
    </>
  )

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Click to edit"
      style={{
        cursor: 'pointer',
        color: value ? 'var(--nd-text-primary)' : 'var(--nd-text-disabled)',
        fontFamily: 'Space Mono, monospace',
        fontSize: 12,
        borderRadius: 2,
        padding: '1px 4px',
        display: 'block',
        transition: 'background 100ms',
      }}
      className="hover:bg-[var(--nd-surface-raised)]"
    >
      {type === 'date' && value ? formatDate(value) : (value || placeholder)}
    </span>
  )
}

function InlineSelect({
  value, options, onSave, colorMap = {},
}: { value: string; options: string[]; onSave: (v: string) => void; colorMap?: Record<string, string> }) {
  return (
    <select
      value={value}
      onChange={e => onSave(e.target.value)}
      style={{
        background: 'transparent',
        border: 'none',
        color: colorMap[value] ?? 'var(--nd-text-secondary)',
        fontFamily: 'Space Mono, monospace',
        fontSize: 11,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        outline: 'none',
        padding: '1px 0',
      }}
    >
      {options.map(o => <option key={o} value={o}>{o || '—'}</option>)}
    </select>
  )
}

export default function TaskRow({
  task, onUpdate, onDelete, assignees,
}: {
  task: TRow
  onUpdate: (id: string, data: Partial<TRow>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  assignees?: string[]
}) {
  const overdue = isTaskOverdue(task)
  const save = (field: keyof TRow) => (raw: string) =>
    onUpdate(task.id, { [field]: raw.trim() || null } as Partial<TRow>)

  const rowBg = overdue ? 'var(--nd-accent-subtle)' : undefined
  const leftBorder = task.status === 'Completed'
    ? '2px solid var(--nd-success)'
    : task.status === 'In Progress'
    ? '2px solid var(--nd-warning)'
    : '2px solid transparent'

  return (
    <tr
      className="group"
      style={{
        borderBottom: '1px solid var(--nd-border)',
        background: rowBg,
        borderLeft: leftBorder,
      }}
    >
      {/* Task name */}
      <td className="px-3 py-2 min-w-[160px]">
        <InlineText
          value={task.name}
          onSave={v => v.trim() && onUpdate(task.id, { name: v.trim() })}
        />
      </td>

      {/* Status */}
      <td className="px-3 py-2">
        <InlineSelect
          value={task.status}
          options={STATUS_OPTIONS}
          onSave={v => onUpdate(task.id, { status: v })}
          colorMap={STATUS_COLOR}
        />
      </td>

      {/* Assignee */}
      <td className="px-3 py-2 min-w-[100px]">
        <InlineText value={task.assignee ?? ''} onSave={save('assignee')} placeholder="—" suggestions={assignees} />
      </td>

      {/* Priority */}
      <td className="px-3 py-2">
        <InlineSelect
          value={task.priority ?? ''}
          options={PRIORITY_OPTIONS}
          onSave={v => onUpdate(task.id, { priority: v || null })}
          colorMap={PRIORITY_COLOR}
        />
      </td>

      {/* Start */}
      <td className="px-3 py-2">
        <InlineText value={task.start_date ?? ''} onSave={save('start_date')} placeholder="—" type="date" />
      </td>

      {/* End */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <InlineText value={task.end_date ?? ''} onSave={save('end_date')} placeholder="—" type="date" />
          {overdue && (
            <span className="nd-label shrink-0" style={{ color: 'var(--nd-accent)', fontSize: 9 }}>OVR</span>
          )}
        </div>
      </td>

      {/* Notes */}
      <td className="px-3 py-2 max-w-[180px]">
        <InlineText value={task.notes ?? ''} onSave={save('notes')} placeholder="—" />
      </td>

      {/* Delete */}
      <td className="px-3 py-2">
        <button
          onClick={() => confirm(`Delete "${task.name}"?`) && onDelete(task.id)}
          className="nd-btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--nd-accent)', fontSize: 11, padding: '2px 6px' }}
        >
          [X]
        </button>
      </td>
    </tr>
  )
}
