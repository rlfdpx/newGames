'use client'

import { useState } from 'react'
import { TaskRow as TRow, GameRow } from '@/lib/supabaseClient'
import { CATEGORIES } from '@/lib/taskTemplate'
import TaskRow from './TaskRow'

export default function TaskBoard({
  tasks, gameId, allGames, onUpdate, onAdd, onAddToAll, onDelete,
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
    acc[cat] = tasks.filter(t => t.category === cat).sort((a, b) => a.sort_order - b.sort_order)
    return acc
  }, {})
  const extraCats = [...new Set(tasks.map(t => t.category))].filter(c => !CATEGORIES.includes(c))
  extraCats.forEach(c => { byCategory[c] = tasks.filter(t => t.category === c) })
  const allCats = [...CATEGORIES, ...extraCats]

  const baseTask = (category: string) => ({
    category, name: newName.trim(), status: 'Not Started' as const,
    assignee: null, start_date: null, end_date: null, priority: null, notes: null,
    sort_order: (byCategory[category]?.length ?? 0) + 100,
  })

  const handleAdd = async (category: string, scope: 'game' | 'all') => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      if (scope === 'all') await onAddToAll(baseTask(category), allGames)
      else await onAdd({ ...baseTask(category), game_id: gameId })
      setNewName(''); setAddingIn(null)
    } finally { setAdding(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {allCats.map(cat => {
        const catTasks = byCategory[cat] ?? []
        const done = catTasks.filter(t => t.status === 'Completed').length

        return (
          <div
            key={cat}
            style={{
              border: '1px solid var(--nd-border)',
              borderRadius: 12,
              overflow: 'hidden',
              background: 'var(--nd-surface)',
            }}
          >
            {/* Category header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--nd-border)', background: 'var(--nd-surface-raised)' }}
            >
              <span className="nd-label" style={{ fontSize: 11 }}>{cat}</span>
              <span className="nd-mono" style={{ fontSize: 11, color: 'var(--nd-text-secondary)' }}>
                {done}/{catTasks.length}
              </span>
            </div>

            {/* Task table */}
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--nd-border)' }}>
                    {['Task', 'Status', 'Assignee', 'Priority', 'Start', 'End', 'Notes', ''].map(h => (
                      <th key={h} className="px-3 py-2 text-left nd-label" style={{ fontWeight: 400, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catTasks.map(t => (
                    <TaskRow key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add task */}
            <div className="px-4 py-2" style={{ borderTop: '1px solid var(--nd-border)' }}>
              {addingIn === cat ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(cat, 'game'); if (e.key === 'Escape') setAddingIn(null) }}
                    placeholder="TASK NAME..."
                    style={{
                      flex: 1, minWidth: 160,
                      background: 'var(--nd-surface-raised)',
                      border: '1px solid var(--nd-border-vis)',
                      borderRadius: 4,
                      color: 'var(--nd-text-primary)',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 12, padding: '6px 10px', outline: 'none',
                      textTransform: 'uppercase',
                    }}
                  />
                  <button disabled={adding} onClick={() => handleAdd(cat, 'game')} className="nd-btn-primary" style={{ fontSize: 11, padding: '6px 14px' }}>
                    This Game
                  </button>
                  <button
                    disabled={adding}
                    onClick={() => handleAdd(cat, 'all')}
                    className="nd-btn-secondary"
                    style={{ fontSize: 11, padding: '6px 14px', borderColor: 'var(--nd-interactive)', color: 'var(--nd-interactive)' }}
                    title={`Add to all ${allGames.length} games`}
                  >
                    All ({allGames.length})
                  </button>
                  <button className="nd-btn-ghost" onClick={() => setAddingIn(null)}>[X]</button>
                </div>
              ) : (
                <button
                  className="nd-btn-ghost"
                  style={{ fontSize: 11, padding: '4px 0' }}
                  onClick={() => { setAddingIn(cat); setNewName('') }}
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
