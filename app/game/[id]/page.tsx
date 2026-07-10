'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { useGames } from '@/lib/useGames'
import { deriveGame, countdownLabel } from '@/lib/derive'
import { formatDate } from '@/lib/dates'
import { TaskRow, GameRow } from '@/lib/supabaseClient'
import TaskBoard from '@/components/TaskBoard'
import FilterBar, { Filters } from '@/components/FilterBar'
import GameForm from '@/components/GameForm'

const STATUS_COLOR: Record<string, string> = {
  'In Development': 'var(--nd-interactive)',
  'In QA':          'var(--nd-warning)',
  'Released':       'var(--nd-success)',
  'On Hold':        'var(--nd-text-disabled)',
  'Cancelled':      'var(--nd-accent)',
}

function SegmentedBar({ completed, total }: { completed: number; total: number }) {
  if (total === 0) return null
  return (
    <div className="flex gap-[2px]" style={{ width: 120 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1,
          background: i < completed ? 'var(--nd-success)' : 'var(--nd-border-vis)',
        }} />
      ))}
    </div>
  )
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { games, tasks, loading, updateGame, updateTask, addTask, addTaskToAllGames, deleteTask } = useGames()
  const [filters, setFilters] = useState<Filters>({ status: '', assignee: '', priority: '', search: '' })
  const [editing, setEditing] = useState(false)

  const game = useMemo(() => games.find(g => g.id === id), [games, id])
  const derived = useMemo(() => game ? deriveGame(game, tasks) : null, [game, tasks])
  const gameTasks = useMemo(() => tasks.filter(t => t.game_id === id), [tasks, id])

  const assignees = useMemo(() => {
    const set = new Set(gameTasks.map(t => t.assignee).filter(Boolean) as string[])
    return [...set].sort()
  }, [gameTasks])

  const filteredTasks = useMemo(() => {
    const s = filters.search.toLowerCase()
    return gameTasks.filter(t => {
      if (filters.status && t.status !== filters.status) return false
      if (filters.assignee && t.assignee !== filters.assignee) return false
      if (filters.priority && t.priority !== filters.priority) return false
      if (s && !t.name.toLowerCase().includes(s) && !(t.notes ?? '').toLowerCase().includes(s)) return false
      return true
    })
  }, [gameTasks, filters])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nd-bg)' }}>
      <span className="nd-mono" style={{ color: 'var(--nd-text-disabled)', fontSize: 13 }}>[Loading...]</span>
    </div>
  )

  if (!game || !derived) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nd-bg)' }}>
      <div className="text-center">
        <div className="nd-mono mb-4" style={{ color: 'var(--nd-text-disabled)' }}>[404 — Game not found]</div>
        <Link href="/" className="nd-btn-ghost">[← Back]</Link>
      </div>
    </div>
  )

  const statusColor = STATUS_COLOR[game.overall_status] ?? 'var(--nd-text-disabled)'

  return (
    <div className="min-h-screen" style={{ background: 'var(--nd-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <Link href="/" className="nd-btn-ghost" style={{ marginBottom: 24, display: 'inline-block', paddingLeft: 0 }}>
          ← All Games
        </Link>

        {/* Hero header */}
        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
          <div>
            <div className="nd-label mb-1" style={{ color: 'var(--nd-text-disabled)' }}>{game.game_name}</div>
            {/* The hero Doto moment */}
            <h1 className="nd-doto" style={{
              fontSize: 56, lineHeight: 1, color: 'var(--nd-text-display)',
              letterSpacing: '-0.02em', marginBottom: 12,
            }}>
              {game.code_name || game.game_name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="nd-label"
                style={{
                  border: `1px solid ${statusColor}`,
                  color: statusColor,
                  borderRadius: 999, padding: '3px 12px', fontSize: 10,
                }}
              >
                {game.overall_status}
              </span>
              <span className="nd-mono" style={{ fontSize: 12, color: 'var(--nd-text-secondary)' }}>
                {game.release_date ? formatDate(game.release_date) : 'NO DATE'}
              </span>
              <span className="nd-label" style={{ fontSize: 10, color: 'var(--nd-text-secondary)' }}>
                {countdownLabel(derived)}
              </span>
            </div>
          </div>

          {/* Progress widget */}
          <div className="flex items-center gap-4">
            <div
              style={{
                background: 'var(--nd-surface)',
                border: '1px solid var(--nd-border)',
                borderRadius: 12,
                padding: '16px 20px',
                minWidth: 180,
              }}
            >
              <div className="nd-label mb-2">Task Progress</div>
              <div className="nd-mono mb-3" style={{ fontSize: 24, color: 'var(--nd-text-display)' }}>
                {derived.completedTasks}
                <span style={{ fontSize: 14, color: 'var(--nd-text-secondary)', marginLeft: 4 }}>
                  / {derived.totalTasks}
                </span>
              </div>
              <SegmentedBar completed={derived.completedTasks} total={derived.totalTasks} />
              <div className="nd-label mt-2" style={{ color: 'var(--nd-text-secondary)' }}>
                {derived.progressPct}% complete
              </div>
            </div>

            <button className="nd-btn-secondary" onClick={() => setEditing(true)}>
              Edit Game
            </button>
          </div>
        </div>

        {/* Notes */}
        {game.notes && (
          <div
            className="mb-6"
            style={{
              background: 'var(--nd-surface)',
              border: '1px solid var(--nd-border)',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 14,
              color: 'var(--nd-text-secondary)',
              fontFamily: 'var(--font-space-grotesk)',
            }}
          >
            {game.notes}
          </div>
        )}

        <FilterBar filters={filters} assignees={assignees} onChange={setFilters} />

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
            await updateGame(game.id, data); setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}
