'use client'

import { use, useState, useMemo } from 'react'
import Link from 'next/link'
import { useGames } from '@/lib/useGames'
import { deriveGame, GameWithStats } from '@/lib/derive'
import { GameRow } from '@/lib/supabaseClient'
import SummaryBar from '@/components/SummaryBar'
import GameCard from '@/components/GameCard'
import FilterBar, { Filters } from '@/components/FilterBar'
import GameForm from '@/components/GameForm'
import RecentActivity from '@/components/RecentActivity'
import ErrorBanner from '@/components/ErrorBanner'
import TaskResults from '@/components/TaskResults'
import { TASK_STATUSES } from '@/lib/constants'

const TEAM_NAMES: Record<string, string> = {
  haiti:   'Haiti Lotomobil',
  nigeria: 'Nigeria',
  ghana:   'Ghana',
}

export default function TeamPage({ params }: { params: Promise<{ team: string }> }) {
  const { team } = use(params)
  const { games, tasks, loading, error, clearError, addGame, updateGame, deleteGame, updateTask, deleteTask } = useGames(team)
  const [showForm, setShowForm] = useState(false)
  const [editGame, setEditGame] = useState<GameWithStats | null>(null)
  const [filters, setFilters] = useState<Filters>({ status: '', assignee: '', priority: '', search: '' })

  const derived = useMemo(() => games.map(g => deriveGame(g, tasks)), [games, tasks])

  const assignees = useMemo(() => {
    const set = new Set(tasks.map(t => t.assignee).filter(Boolean) as string[])
    return [...set].sort()
  }, [tasks])

  const modifiedTodayIds = useMemo(() => {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
    const ids = new Set<string>()
    tasks.forEach(t => { if (new Date(t.updated_at) >= startOfToday) ids.add(t.game_id) })
    games.forEach(g => { if (new Date(g.updated_at) >= startOfToday) ids.add(g.id) })
    return ids
  }, [tasks, games])

  const hasActiveFilters = Boolean(filters.status || filters.assignee || filters.priority || filters.search)

  const filteredTasks = useMemo(() => {
    const s = filters.search.toLowerCase()
    const gameById = new Map(games.map(g => [g.id, g]))
    return tasks.filter(t => {
      if (filters.status && t.status !== filters.status) return false
      if (filters.assignee && t.assignee !== filters.assignee) return false
      if (filters.priority && t.priority !== filters.priority) return false
      if (s) {
        const g = gameById.get(t.game_id)
        const haystack = [t.name, t.notes ?? '', g?.game_name ?? '', g?.code_name ?? ''].join(' ').toLowerCase()
        if (!haystack.includes(s)) return false
      }
      return true
    })
  }, [tasks, games, filters])

  const handleSave = async (data: Omit<GameRow, 'id' | 'created_at' | 'updated_at' | 'team'>) => {
    try {
      if (editGame) { await updateGame(editGame.id, data); setEditGame(null) }
      else { await addGame(data); setShowForm(false) }
    } catch {
      // Error surfaced via ErrorBanner
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--nd-bg)' }}>
      <ErrorBanner message={error} onDismiss={clearError} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <Link href="/" className="nd-label mb-2 inline-block" style={{ color: 'var(--nd-text-disabled)', letterSpacing: '0.1em', textDecoration: 'none' }}>
              ← All Teams
            </Link>
            <h1 style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 28, fontWeight: 500,
              color: 'var(--nd-text-display)',
              letterSpacing: '-0.01em',
            }}>
              {TEAM_NAMES[team] ?? team}
            </h1>
            <div className="nd-label mt-1" style={{ letterSpacing: '0.1em' }}>Portfolio · Live</div>
          </div>
          <button className="nd-btn-primary" onClick={() => setShowForm(true)}>
            + New Game
          </button>
        </div>

        {loading ? (
          <div className="nd-mono text-center py-24" style={{ color: 'var(--nd-text-disabled)', fontSize: 13 }}>
            [Loading...]
          </div>
        ) : (
          <>
            <SummaryBar games={derived} />
            <RecentActivity tasks={tasks} games={games} />
            <FilterBar filters={filters} assignees={assignees} onChange={setFilters} statusOptions={TASK_STATUSES} />

            {hasActiveFilters ? (
              <TaskResults games={games} tasks={filteredTasks} assignees={assignees} onUpdate={updateTask} onDelete={deleteTask} />
            ) : derived.length === 0 ? (
              <div className="text-center py-24">
                <div className="nd-mono" style={{ color: 'var(--nd-text-disabled)', fontSize: 13 }}>
                  [ No games yet ]
                </div>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {derived.map(g => (
                  <GameCard
                    key={g.id}
                    game={g}
                    modifiedToday={modifiedTodayIds.has(g.id)}
                    onEdit={g => setEditGame(g)}
                    onDelete={deleteGame}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {(showForm || editGame) && (
        <GameForm
          initial={editGame}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditGame(null) }}
        />
      )}
    </div>
  )
}
