'use client'

import { useState } from 'react'
import { TaskRow as TRow } from '@/lib/supabaseClient'
import { GameRow } from '@/lib/supabaseClient'
import { CATEGORIES } from '@/lib/taskTemplate'
import TaskRow from './TaskRow'

export default function TaskBoard({
  tasks,
  gameId,
  allGames,
  onUpdate,
  onAdd,
  onAddToAll,
  onDelete,
}: {
  tasks: TRow[]
  gameId: string
  allGames: GameRow[]
  onUpdate: (id: string, data: Partial<TRow>) => Promise<void>
  onAdd: (data: Omit<TRow, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onAddToAll: (data: Omit<TRow, 'id' | 'game_id' | 'created_at' | 'updated_at'>, allGames: GameRow[]) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [addingIn, setAddingIn] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const byCategory = CATEGORIES.reduce<Record<string, TRow[]>>((acc, cat) => {
    acc[cat] = tasks.filter((t) => t.category === cat).sort((a, b) => a.sort_order - b.sort_order)
    return acc
  }, {})

  const extraCats = [...new Set(tasks.map((t) => t.category))].filter((c) => !CATEGORIES.includes(c))
  extraCats.forEach((c) => { byCategory[c] = tasks.filter((t) => t.category === c) })

  const allCats = [...CATEGORIES, ...extraCats]

  const baseTask = (category: string) => ({
    category,
    name: newName.trim(),
    status: 'Not Started' as const,
    assignee: null,
    start_date: null,
    end_date: null,
    priority: null,
    notes: null,
    sort_order: (byCategory[category]?.length ?? 0) + 100,
  })

  const handleAdd = async (category: string, scope: 'game' | 'all') => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      if (scope === 'all') {
        await onAddToAll(baseTask(category), allGames)
      } else {
        await onAdd({ ...baseTask(category), game_id: gameId })
      }
      setNewName('')
      setAddingIn(null)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {allCats.map((cat) => {
        const catTasks = byCategory[cat] ?? []
        const done = catTasks.filter((t) => t.status === 'Completed').length

        return (
          <div key={cat} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            {/* Category header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-medium text-gray-700 dark:text-gray-200 text-sm">{cat}</h3>
              <span className="text-xs text-gray-400">{done}/{catTasks.length} done</span>
            </div>

            {/* Task table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-3 py-2">Task</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Assignee</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Start</th>
                    <th className="px-3 py-2">End</th>
                    <th className="px-3 py-2">Notes</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {catTasks.map((t) => (
                    <TaskRow key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add task inline */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
              {addingIn === cat ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(cat, 'game'); if (e.key === 'Escape') setAddingIn(null) }}
                    placeholder="Task name…"
                    className="flex-1 min-w-[180px] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    disabled={adding}
                    onClick={() => handleAdd(cat, 'game')}
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    This game
                  </button>
                  <button
                    disabled={adding}
                    onClick={() => handleAdd(cat, 'all')}
                    title={`Add to all ${allGames.length} games`}
                    className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    All games ({allGames.length})
                  </button>
                  <button onClick={() => setAddingIn(null)} className="text-sm text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingIn(cat); setNewName('') }}
                  className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                >
                  + Add task
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
