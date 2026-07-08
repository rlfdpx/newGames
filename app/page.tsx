'use client'

import { useState, useMemo } from 'react'
import { useGames } from '@/lib/useGames'
import { deriveGame, GameWithStats } from '@/lib/derive'
import { GameRow } from '@/lib/supabaseClient'
import SummaryBar from '@/components/SummaryBar'
import GameCard from '@/components/GameCard'
import FilterBar, { Filters } from '@/components/FilterBar'
import GameForm from '@/components/GameForm'

export default function Home() {
  const { games, tasks, loading, addGame, updateGame, deleteGame } = useGames()
  const [showForm, setShowForm] = useState(false)
  const [editGame, setEditGame] = useState<GameWithStats | null>(null)
  const [filters, setFilters] = useState<Filters>({ status: '', assignee: '', priority: '', search: '' })

  const derived = useMemo(() => games.map((g) => deriveGame(g, tasks)), [games, tasks])

  const assignees = useMemo(() => {
    const set = new Set(tasks.map((t) => t.assignee).filter(Boolean) as string[])
    return [...set].sort()
  }, [tasks])

  const filtered = useMemo(() => {
    const s = filters.search.toLowerCase()
    return derived.filter((g) => {
      if (filters.status && g.overall_status !== filters.status) return false
      if (filters.assignee) {
        const gameTasks = tasks.filter((t) => t.game_id === g.id && t.assignee === filters.assignee)
        if (gameTasks.length === 0) return false
      }
      if (s && !g.game_name.toLowerCase().includes(s) && !(g.code_name ?? '').toLowerCase().includes(s)) return false
      return true
    })
  }, [derived, filters, tasks])

  const handleSave = async (data: Omit<GameRow, 'id' | 'created_at' | 'updated_at'>) => {
    if (editGame) {
      await updateGame(editGame.id, data)
      setEditGame(null)
    } else {
      await addGame(data)
      setShowForm(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Games Launch Tracker HT</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Games portfolio · live</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-4 py-2 text-sm transition-colors"
          >
            + Add Game
          </button>
        </div>

        {loading ? (
          <div className="text-center py-24 text-gray-400">Loading…</div>
        ) : (
          <>
            <SummaryBar games={derived} />
            <FilterBar filters={filters} assignees={assignees} onChange={setFilters} />

            {filtered.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                {derived.length === 0 ? 'No games yet — add one above.' : 'No games match the current filters.'}
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((g) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    onEdit={(g) => setEditGame(g)}
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
