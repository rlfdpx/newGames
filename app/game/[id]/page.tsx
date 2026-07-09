'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { useGames } from '@/lib/useGames'
import { deriveGame, countdownLabel } from '@/lib/derive'
import { formatDate } from '@/lib/dates'
import { TaskRow } from '@/lib/supabaseClient'
import { GameWithStats } from '@/lib/derive'
import TaskBoard from '@/components/TaskBoard'
import FilterBar, { Filters } from '@/components/FilterBar'
import GameForm from '@/components/GameForm'
import { GameRow } from '@/lib/supabaseClient'

const STATUS_COLORS: Record<string, string> = {
  'In Development': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'In QA':          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Released':       'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'On Hold':        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'Cancelled':      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { games, tasks, loading, updateGame, updateTask, addTask, addTaskToAllGames, deleteTask } = useGames()
  const [filters, setFilters] = useState<Filters>({ status: '', assignee: '', priority: '', search: '' })
  const [editing, setEditing] = useState(false)

  const game = useMemo(() => games.find((g) => g.id === id), [games, id])
  const derived = useMemo(() => game ? deriveGame(game, tasks) : null, [game, tasks])
  const gameTasks = useMemo(() => tasks.filter((t) => t.game_id === id), [tasks, id])

  const assignees = useMemo(() => {
    const set = new Set(gameTasks.map((t) => t.assignee).filter(Boolean) as string[])
    return [...set].sort()
  }, [gameTasks])

  const filteredTasks = useMemo(() => {
    const s = filters.search.toLowerCase()
    return gameTasks.filter((t) => {
      if (filters.status && t.status !== filters.status) return false
      if (filters.assignee && t.assignee !== filters.assignee) return false
      if (filters.priority && t.priority !== filters.priority) return false
      if (s && !t.name.toLowerCase().includes(s) && !(t.notes ?? '').toLowerCase().includes(s)) return false
      return true
    })
  }, [gameTasks, filters])

  if (loading) return <div className="text-center py-24 text-gray-400">Loading…</div>
  if (!game || !derived) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Game not found.</p>
        <Link href="/" className="text-blue-600 hover:underline">← Back to portfolio</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back + header */}
        <Link href="/" className="text-sm text-gray-400 hover:text-blue-600 transition-colors mb-4 inline-block">
          ← All Games
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-gray-400 dark:text-gray-500">{game.game_name}</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {game.code_name || game.game_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[game.overall_status] ?? ''}`}>
                {game.overall_status}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                📅 {game.release_date ? formatDate(game.release_date) : 'No date'} · {countdownLabel(derived)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress pill */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2">
              <div className="w-24 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${derived.progressPct}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {derived.completedTasks}/{derived.totalTasks} ({derived.progressPct}%)
              </span>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Edit Game
            </button>
          </div>
        </div>

        {/* Notes */}
        {game.notes && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            {game.notes}
          </p>
        )}

        {/* Task filters */}
        <FilterBar filters={filters} assignees={assignees} onChange={setFilters} />

        {/* Task board */}
        <TaskBoard
          tasks={filteredTasks}
          gameId={id}
          allGames={games}
          onUpdate={updateTask}
          onAdd={addTask}
          onAddToAll={addTaskToAllGames}
          onDelete={deleteTask}
        />
      </div>

      {editing && (
        <GameForm
          initial={game}
          onSave={async (data: Omit<GameRow, 'id' | 'created_at' | 'updated_at'>) => {
            await updateGame(game.id, data)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}
