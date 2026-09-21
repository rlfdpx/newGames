'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSession, assigneeNames, usePeople } from '@/lib/useSession'
import { useMyTasks, dueBucket, DueBucket, DUE_BUCKET_LABELS, DUE_BUCKET_ORDER } from '@/lib/useMyTasks'
import { today } from '@/lib/dates'
import { TaskRow as TRow } from '@/lib/supabaseClient'
import TaskRow from '@/components/TaskRow'
import ErrorBanner from '@/components/ErrorBanner'
import ThemeToggle from '@/components/ThemeToggle'
import UserBadge from '@/components/UserBadge'

export default function MyTasksPage() {
  const { person, loading: sessionLoading } = useSession()
  const people = usePeople()
  const names = useMemo(() => assigneeNames(person), [person])
  const { games, tasks, loading, error, clearError, updateTask } = useMyTasks(names)

  const assignees = useMemo(() => people.map((p) => p.display_name), [people])
  const gameById = useMemo(() => new Map(games.map((g) => [g.id, g])), [games])
  const todayIso = today()

  // Open work first, grouped by urgency; anything already Completed drops to
  // its own section so the top of the page is only what still needs doing.
  const { buckets, done } = useMemo(() => {
    const buckets = new Map<DueBucket, TRow[]>()
    const done: TRow[] = []

    for (const task of tasks) {
      if (task.status === 'Completed') { done.push(task); continue }
      const key = dueBucket(task, todayIso)
      const list = buckets.get(key) ?? []
      list.push(task)
      buckets.set(key, list)
    }
    return { buckets, done }
  }, [tasks, todayIso])

  const openCount = tasks.length - done.length

  return (
    <div className="min-h-screen" style={{ background: 'var(--nd-bg)' }}>
      <ErrorBanner message={error} onDismiss={clearError} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <Link
              href="/"
              className="nd-label mb-2 inline-block"
              style={{ color: 'var(--nd-text-disabled)', letterSpacing: '0.1em', textDecoration: 'none' }}
            >
              ← All Teams
            </Link>
            <h1 style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 28, fontWeight: 500,
              color: 'var(--nd-text-display)',
              letterSpacing: '-0.01em',
            }}>
              My Tasks
            </h1>
            <div className="nd-label mt-1" style={{ letterSpacing: '0.1em' }}>
              {person ? `${person.display_name} · ${openCount} open` : 'Loading…'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserBadge />
            <ThemeToggle />
          </div>
        </div>

        {sessionLoading || loading ? (
          <div className="nd-mono text-center py-24" style={{ color: 'var(--nd-text-disabled)', fontSize: 13 }}>
            [Loading...]
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-24">
            <div className="nd-mono" style={{ color: 'var(--nd-text-disabled)', fontSize: 13 }}>
              [ Nothing assigned to you ]
            </div>
            {person && (
              <div className="nd-label mt-3" style={{ color: 'var(--nd-text-disabled)', fontSize: 11 }}>
                Matching on: {names.join(', ')}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {DUE_BUCKET_ORDER.map((key) => {
              const rows = buckets.get(key)
              if (!rows?.length) return null
              return (
                <TaskGroup
                  key={key}
                  title={DUE_BUCKET_LABELS[key]}
                  accent={key === 'overdue' ? 'var(--nd-accent)' : undefined}
                  rows={rows}
                  gameById={gameById}
                  assignees={assignees}
                  onUpdate={updateTask}
                />
              )
            })}

            {done.length > 0 && (
              <TaskGroup
                title="Completed"
                rows={done}
                gameById={gameById}
                assignees={assignees}
                onUpdate={updateTask}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskGroup({
  title, accent, rows, gameById, assignees, onUpdate,
}: {
  title: string
  accent?: string
  rows: TRow[]
  gameById: Map<string, { id: string; team: string; game_name: string; code_name: string | null }>
  assignees: string[]
  onUpdate: (id: string, data: Partial<TRow>) => Promise<void>
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="nd-label" style={{ color: accent ?? 'var(--nd-text-secondary)', letterSpacing: '0.1em' }}>
          {title}
        </span>
        <span className="nd-mono" style={{ fontSize: 11, color: 'var(--nd-text-disabled)' }}>
          {rows.length}
        </span>
      </div>

      <div
        style={{
          border: '1px solid var(--nd-border)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--nd-surface)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--nd-border)' }}>
                {['Game', 'Task', 'Status', 'Assignee', 'Priority', 'Start', 'End', 'Notes', ''].map((h) => (
                  <th key={h} className="px-3 py-2 text-left nd-label" style={{ fontWeight: 400, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const game = gameById.get(t.game_id)
                return (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onUpdate={onUpdate}
                    assignees={assignees}
                    leadCell={
                      game ? (
                        <Link
                          href={`/team/${game.team}/game/${game.id}`}
                          className="nd-label"
                          style={{ fontSize: 10, color: 'var(--nd-interactive)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                        >
                          {game.code_name || game.game_name}
                        </Link>
                      ) : (
                        <span className="nd-label" style={{ fontSize: 10, color: 'var(--nd-text-disabled)' }}>—</span>
                      )
                    }
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
