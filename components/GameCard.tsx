'use client'

import Link from 'next/link'
import { GameWithStats, countdownLabel } from '@/lib/derive'
import { formatDate } from '@/lib/dates'
import { GAME_STATUS_COLORS } from '@/lib/constants'

const COUNTDOWN_COLORS: Record<string, string> = {
  overdue: 'var(--nd-accent)',
  urgent:  'var(--nd-accent)',
  soon:    'var(--nd-warning)',
  future:  'var(--nd-text-secondary)',
  none:    'var(--nd-text-disabled)',
}

function SegmentedBar({ completed, inProgress, total }: { completed: number; inProgress: number; total: number }) {
  if (total === 0) return null
  return (
    <div className="flex gap-[2px] w-full">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 6,
            flex: 1,
            background:
              i < completed ? 'var(--nd-success)' :
              i < completed + inProgress ? 'var(--nd-warning)' :
              'var(--nd-border-vis)',
          }}
        />
      ))}
    </div>
  )
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
  const statusColor = GAME_STATUS_COLORS[game.overall_status] ?? 'var(--nd-text-disabled)'
  const cdColor = COUNTDOWN_COLORS[game.countdownState]

  return (
    <div
      className="nd-card flex flex-col p-5 gap-4 transition-colors"
      style={{ position: 'relative' }}
    >
      {/* Today dot */}
      {modifiedToday && (
        <span
          title="Modified today"
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--nd-success)',
            boxShadow: '0 0 6px var(--nd-success)',
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="nd-label" style={{ color: 'var(--nd-text-disabled)' }}>{game.game_name}</div>
        <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 20, fontWeight: 500, color: 'var(--nd-text-display)', lineHeight: 1.2 }}>
          {game.code_name || game.game_name}
        </div>
        {/* Status pill */}
        <div style={{ marginTop: 4 }}>
          <span
            className="nd-label"
            style={{
              display: 'inline-block',
              border: `1px solid ${statusColor}`,
              color: statusColor,
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 10,
            }}
          >
            {game.overall_status}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <span className="nd-label">Progress</span>
          <span className="nd-mono" style={{ fontSize: 12, color: 'var(--nd-text-primary)' }}>
            {game.completedTasks}/{game.totalTasks}
            <span style={{ color: 'var(--nd-text-secondary)', marginLeft: 4 }}>{game.progressPct}%</span>
          </span>
        </div>
        <SegmentedBar completed={game.completedTasks} inProgress={game.inProgressTasks} total={game.totalTasks} />
      </div>

      {/* Release / countdown */}
      <div className="flex items-center justify-between gap-2">
        <span className="nd-mono" style={{ fontSize: 12, color: 'var(--nd-text-secondary)' }}>
          {game.release_date ? formatDate(game.release_date) : 'NO DATE'}
        </span>
        <span className="nd-label" style={{ color: cdColor, fontSize: 10 }}>
          {countdownLabel(game)}
        </span>
      </div>

      {/* Notes */}
      {game.notes && (
        <p style={{ fontSize: 12, color: 'var(--nd-text-disabled)', lineHeight: 1.5, margin: 0 }}
          className="line-clamp-2">
          {game.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <Link
          href={`/team/${game.team}/game/${game.id}`}
          className="nd-btn-primary flex-1 text-center"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 11 }}
        >
          View Tasks
        </Link>
        <button className="nd-btn-secondary" style={{ padding: '8px 14px', fontSize: 11 }} onClick={() => onEdit(game)}>
          Edit
        </button>
        <button
          className="nd-btn-destructive"
          style={{ padding: '8px 14px', fontSize: 11 }}
          onClick={() => { if (confirm(`Delete "${game.code_name || game.game_name}"?`)) onDelete(game.id) }}
        >
          Del
        </button>
      </div>
    </div>
  )
}
