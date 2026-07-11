'use client'

import { TASK_PRIORITIES } from '@/lib/constants'

export type Filters = {
  status: string
  assignee: string
  priority: string
  search: string
}

const SELECT_STYLE: React.CSSProperties = {
  background: 'var(--nd-surface-raised)',
  border: '1px solid var(--nd-border-vis)',
  borderRadius: 4,
  color: 'var(--nd-text-primary)',
  fontFamily: 'Space Mono, monospace',
  fontSize: 12,
  letterSpacing: '0.04em',
  padding: '8px 12px',
  outline: 'none',
  cursor: 'pointer',
}

export default function FilterBar({
  filters,
  assignees,
  onChange,
  statusOptions,
}: {
  filters: Filters
  assignees: string[]
  onChange: (f: Filters) => void
  statusOptions: string[]
}) {
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value })

  const hasFilters = filters.status || filters.assignee || filters.priority || filters.search

  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center">
      <input
        type="text"
        placeholder="SEARCH..."
        value={filters.search}
        onChange={set('search')}
        style={{
          ...SELECT_STYLE,
          minWidth: 180,
          fontFamily: 'Space Mono, monospace',
          textTransform: 'uppercase',
        }}
        className="placeholder-[var(--nd-text-disabled)]"
      />

      <select value={filters.status} onChange={set('status')} style={SELECT_STYLE}>
        <option value="">ALL STATUS</option>
        {statusOptions.map((s) => <option key={s}>{s}</option>)}
      </select>

      <select value={filters.assignee} onChange={set('assignee')} style={SELECT_STYLE}>
        <option value="">ALL ASSIGNEES</option>
        {assignees.map((a) => <option key={a}>{a}</option>)}
      </select>

      <select value={filters.priority} onChange={set('priority')} style={SELECT_STYLE}>
        <option value="">ALL PRIORITY</option>
        {TASK_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
      </select>

      {hasFilters && (
        <button
          className="nd-btn-ghost"
          onClick={() => onChange({ status: '', assignee: '', priority: '', search: '' })}
        >
          [Clear]
        </button>
      )}
    </div>
  )
}
