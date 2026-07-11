'use client'

import Link from 'next/link'
import { TaskRow as TRow, GameRow } from '@/lib/supabaseClient'
import TaskRow from './TaskRow'

// Filtered task list for the portfolio page: matching tasks grouped by game,
// with the same inline-editable rows as the per-game task board.
export default function TaskResults({
  games, tasks, onUpdate, onDelete,
}: {
  games: GameRow[]
  tasks: TRow[]
  onUpdate: (id: string, data: Partial<TRow>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const byGame = games
    .map(game => ({
      game,
      rows: tasks.filter(t => t.game_id === game.id).sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter(({ rows }) => rows.length > 0)

  if (byGame.length === 0) return (
    <div className="text-center py-24">
      <div className="nd-mono" style={{ color: 'var(--nd-text-disabled)', fontSize: 13 }}>
        [ No matching tasks ]
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {byGame.map(({ game, rows }) => (
        <div
          key={game.id}
          style={{
            border: '1px solid var(--nd-border)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'var(--nd-surface)',
          }}
        >
          {/* Game header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--nd-border)', background: 'var(--nd-surface-raised)' }}
          >
            <Link
              href={`/game/${game.id}`}
              className="nd-label"
              style={{ fontSize: 11, color: 'var(--nd-interactive)', textDecoration: 'none' }}
            >
              {game.code_name || game.game_name} →
            </Link>
            <span className="nd-mono" style={{ fontSize: 11, color: 'var(--nd-text-secondary)' }}>
              {rows.length} task{rows.length === 1 ? '' : 's'}
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
                {rows.map(t => (
                  <TaskRow key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
