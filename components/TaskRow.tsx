'use client'

import { useState } from 'react'
import { TaskRow as TRow } from '@/lib/supabaseClient'
import { isTaskOverdue } from '@/lib/derive'
import { formatDate } from '@/lib/dates'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed']
const PRIORITY_COLORS: Record<string, string> = {
  High:   'text-red-600 dark:text-red-400',
  Medium: 'text-amber-600 dark:text-amber-400',
  Low:    'text-gray-400 dark:text-gray-500',
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
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...task })
  const overdue = isTaskOverdue(task)

  const statusColor =
    task.status === 'Completed'
      ? 'text-green-600 dark:text-green-400'
      : task.status === 'In Progress'
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-gray-400 dark:text-gray-500'

  if (editing) {
    return (
      <tr className="bg-blue-50 dark:bg-blue-950/30">
        <td className="px-3 py-2" colSpan={7}>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={INPUT}
              placeholder="Task name"
            />
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className={INPUT}
            >
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input
              value={form.assignee ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              className={INPUT}
              placeholder="Assignee"
            />
            <select
              value={form.priority ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className={INPUT}
            >
              <option value="">—</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <input
              type="date"
              value={form.start_date ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value || null }))}
              className={INPUT}
              title="Start date"
            />
            <input
              type="date"
              value={form.end_date ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value || null }))}
              className={INPUT}
              title="End date"
            />
            <input
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={`${INPUT} min-w-[160px]`}
              placeholder="Notes"
            />
            <button
              onClick={async () => {
                await onUpdate(task.id, {
                  name: form.name,
                  status: form.status,
                  assignee: form.assignee || null,
                  priority: form.priority || null,
                  start_date: form.start_date || null,
                  end_date: form.end_date || null,
                  notes: form.notes || null,
                })
                setEditing(false)
              }}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr
      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${overdue ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
    >
      <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
        {task.name}
        {overdue && <span className="ml-2 text-xs text-red-500">overdue</span>}
      </td>
      <td className="px-3 py-2">
        <select
          value={task.status}
          onChange={(e) => onUpdate(task.id, { status: e.target.value })}
          className={`text-xs font-medium bg-transparent focus:outline-none cursor-pointer ${statusColor}`}
        >
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </td>
      <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{task.assignee ?? '—'}</td>
      <td className={`px-3 py-2 text-xs font-medium ${PRIORITY_COLORS[task.priority ?? ''] ?? 'text-gray-400'}`}>
        {task.priority ?? '—'}
      </td>
      <td className="px-3 py-2 text-xs text-gray-400">{formatDate(task.start_date)}</td>
      <td className="px-3 py-2 text-xs text-gray-400">{formatDate(task.end_date)}</td>
      <td className="px-3 py-2 text-xs text-gray-400 max-w-[160px] truncate">{task.notes ?? ''}</td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-blue-600 px-1">Edit</button>
          <button
            onClick={() => confirm(`Delete task "${task.name}"?`) && onDelete(task.id)}
            className="text-xs text-gray-300 hover:text-red-500 px-1"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  )
}

const INPUT = 'border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500'
