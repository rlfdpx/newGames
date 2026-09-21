'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, GameRow, TaskRow } from './supabaseClient'

/**
 * Cross-team task loader for the "My Tasks" view.
 *
 * Deliberately loads everything and filters in memory rather than pushing an
 * `in` filter to Postgrest: assignee is free text typed by hand, so matching
 * has to be case-insensitive and trimmed, which `in` can't express. The whole
 * table is a few hundred rows.
 */
export function useMyTasks(names: string[]) {
  const [games, setGames] = useState<GameRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const namesKey = names.join('|')

  const loadAll = useCallback(async () => {
    const [{ data: g, error: gErr }, { data: t, error: tErr }] = await Promise.all([
      supabase.from('games').select('*').order('sort_order'),
      supabase.from('tasks').select('*').not('assignee', 'is', null).order('end_date', { nullsFirst: false }),
    ])

    if (gErr || tErr) setError(`Loading tasks failed: ${(gErr ?? tErr)?.message ?? 'Unknown error'}`)

    const wanted = new Set(namesKey.split('|').filter(Boolean))
    setGames(g ?? [])
    setTasks((t ?? []).filter((row) => wanted.has((row.assignee ?? '').trim().toLowerCase())))
    setLoading(false)
  }, [namesKey])

  useEffect(() => {
    // `loadAll` sets state, so it's wrapped rather than called directly in the
    // effect body — same pattern as lib/useGames.ts, to satisfy
    // react-hooks/set-state-in-effect.
    async function initialLoad() {
      if (!namesKey) { setTasks([]); setLoading(false); return }
      await loadAll()
    }
    initialLoad()

    const channel = supabase
      .channel('my-tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadAll, namesKey])

  const updateTask = async (id: string, data: Partial<TaskRow>) => {
    const { error: updateError } = await supabase.from('tasks').update(data).eq('id', id)
    if (updateError) setError(`Updating task failed: ${updateError.message}`)
    await loadAll()
  }

  return { games, tasks, loading, error, clearError, updateTask }
}

export type DueBucket = 'overdue' | 'week' | 'later' | 'none'

export const DUE_BUCKET_LABELS: Record<DueBucket, string> = {
  overdue: 'Overdue',
  week: 'Due this week',
  later: 'Later',
  none: 'No due date',
}

export const DUE_BUCKET_ORDER: DueBucket[] = ['overdue', 'week', 'later', 'none']

/** Buckets an incomplete task by its end_date relative to today. */
export function dueBucket(task: TaskRow, todayIso: string): DueBucket {
  if (!task.end_date) return 'none'
  if (task.end_date < todayIso) return 'overdue'

  const days = Math.round(
    (new Date(task.end_date).getTime() - new Date(todayIso).getTime()) / 86_400_000,
  )
  return days <= 7 ? 'week' : 'later'
}
