'use client'

import Link from 'next/link'
import { GameWithStats, countdownLabel } from '@/lib/derive'
import { formatDate } from '@/lib/dates'

const STATUS_COLORS: Record<string, string> = {
  'In Development': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'In QA':          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Released':       'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'On Hold':        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'Cancelled':      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
}

const COUNTDOWN_COLORS: Record<string, string> = {
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  urgent:  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  soon:    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  future:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  none:    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

export default function GameCard({
  game,
  modifiedToday = false,
  onEdit,
  onDelete,
}: {
  game: GameWithStats
  modifiedToday?: boolean
  onEdit: (g: GameWithStats) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {modifiedToday && (
            <span
              title="Modified today"
              className="shrink-0 w-2 h-2 rounded-full bg-green-400 dark:bg-green-500 animate-pulse"
            />
          )}
          <div className="min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{game.game_name}</p>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
              {game.code_name || game.game_name}
            </h3>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[game.overall_status] ?? STATUS_COLORS['On Hold']}`}>
          {game.overall_status}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{game.completedTasks}/{game.totalTasks} tasks ({game.progressPct}%)</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${game.progressPct}%` }}
          />
        </div>
      </div>

      {/* Release date + countdown */}
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          {game.release_date ? `📅 ${formatDate(game.release_date)}` : '📅 No date set'}
        </span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${COUNTDOWN_COLORS[game.countdownState]}`}>
          {countdownLabel(game)}
        </span>
      </div>

      {/* Notes */}
      {game.notes && (
        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{game.notes}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 mt-auto">
        <Link
          href={`/game/${game.id}`}
          className="flex-1 text-center text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 transition-colors"
        >
          View Tasks
        </Link>
        <button
          onClick={() => onEdit(game)}
          className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
        >
          Edit
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${game.code_name || game.game_name}"?`)) onDelete(game.id)
          }}
          className="text-sm px-3 py-1.5 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
