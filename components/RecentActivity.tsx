'use client'

import Link from 'next/link'
import { TaskRow, GameRow } from '@/lib/supabaseClient'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function RecentActivity({ tasks, games }: { tasks: TaskRow[]; games: GameRow[] }) {
  const gameMap = Object.fromEntries(games.map((g) => [g.id, g]))

  const recent = [...tasks]
    .filter((t) => t.status === 'Completed')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6)

  if (recent.length === 0) return null

  return (
    <div className="mb-8">
      <div className="nd-label mb-3">Recently Completed</div>
      <div
        style={{
          border: '1px solid var(--nd-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {recent.map((task, i) => {
          const game = gameMap[task.game_id]
          if (!game) return null
          return (
            <Link
              key={task.id}
              href={`/game/${game.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderBottom: i < recent.length - 1 ? '1px solid var(--nd-border)' : 'none',
                background: 'var(--nd-surface)',
                textDecoration: 'none',
                transition: 'background 150ms',
              }}
              className="group"
            >
              {/* Check */}
              <span
                className="nd-mono shrink-0"
                style={{ fontSize: 11, color: 'var(--nd-success)', letterSpacing: 0 }}
              >
                [OK]
              </span>

              {/* Task name */}
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: 'var(--nd-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-space-grotesk)',
                }}
              >
                {task.name}
              </span>

              {/* Game */}
              <span className="nd-label shrink-0" style={{ color: 'var(--nd-interactive)', letterSpacing: '0.06em' }}>
                {game.code_name ?? game.game_name}
              </span>

              {/* Assignee */}
              {task.assignee && (
                <span className="nd-label shrink-0 hidden sm:inline" style={{ minWidth: 80 }}>
                  {task.assignee.split(' ')[0]}
                </span>
              )}

              {/* Time */}
              <span className="nd-mono shrink-0" style={{ fontSize: 11, color: 'var(--nd-text-disabled)', minWidth: 56, textAlign: 'right' }}>
                {timeAgo(task.updated_at)}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
