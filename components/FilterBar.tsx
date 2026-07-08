'use client'

const STATUSES = ['In Development', 'In QA', 'Released', 'On Hold', 'Cancelled']

export type Filters = {
  status: string
  assignee: string
  priority: string
  search: string
}

export default function FilterBar({
  filters,
  assignees,
  onChange,
}: {
  filters: Filters
  assignees: string[]
  onChange: (f: Filters) => void
}) {
  const set = (key: keyof Filters) => (value: string) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <input
        type="text"
        placeholder="Search games or tasks…"
        value={filters.search}
        onChange={(e) => set('search')(e.target.value)}
        className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
      />

      <select
        value={filters.status}
        onChange={(e) => set('status')(e.target.value)}
        className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <select
        value={filters.assignee}
        onChange={(e) => set('assignee')(e.target.value)}
        className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All assignees</option>
        {assignees.map((a) => (
          <option key={a}>{a}</option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => set('priority')(e.target.value)}
        className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All priorities</option>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      {(filters.status || filters.assignee || filters.priority || filters.search) && (
        <button
          onClick={() => onChange({ status: '', assignee: '', priority: '', search: '' })}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2"
        >
          Clear
        </button>
      )}
    </div>
  )
}
