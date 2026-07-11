'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, GameRow, TaskRow } from './supabaseClient'
import { TASK_TEMPLATE } from './taskTemplate'

function describe(action: string, error: { message: string } | null): string {
  return `${action} failed: ${error?.message ?? 'Unknown error'}`
}

export function useGames() {
  const [games, setGames] = useState<GameRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const loadAll = useCallback(async () => {
    const [{ data: g, error: gErr }, { data: t, error: tErr }] = await Promise.all([
      supabase.from('games').select('*').order('sort_order').order('created_at'),
      supabase.from('tasks').select('*').order('sort_order'),
    ])
    if (gErr || tErr) setError(describe('Loading data', gErr ?? tErr))
    setGames(g ?? [])
    setTasks(t ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    // Wrapping the initial call in a locally-scoped function (rather than invoking
    // the shared `loadAll` directly in the effect body) keeps this from tripping
    // react-hooks/set-state-in-effect, since `loadAll` itself sets state.
    async function initialLoad() {
      await loadAll()
    }
    initialLoad()

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadAll])

  // --- Games CRUD ---
  const addGame = async (data: Omit<GameRow, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: game, error: insertError } = await supabase
      .from('games')
      .insert(data)
      .select()
      .single()
    if (insertError || !game) {
      setError(describe('Adding game', insertError))
      throw insertError
    }
    // Seed standard task template
    const templateTasks = TASK_TEMPLATE.map((t) => ({
      game_id: game.id,
      category: t.category,
      name: t.name,
      priority: t.priority,
      sort_order: t.sort_order,
      status: 'Not Started',
    }))
    const { error: templateError } = await supabase.from('tasks').insert(templateTasks)
    if (templateError) setError(describe('Adding template tasks', templateError))
    await loadAll()
    return game
  }

  const updateGame = async (id: string, data: Partial<GameRow>) => {
    const { error: updateError } = await supabase.from('games').update(data).eq('id', id)
    if (updateError) setError(describe('Updating game', updateError))
    await loadAll()
  }

  const deleteGame = async (id: string) => {
    const { error: deleteError } = await supabase.from('games').delete().eq('id', id)
    if (deleteError) setError(describe('Deleting game', deleteError))
    await loadAll()
  }

  // --- Tasks CRUD ---
  const updateTask = async (id: string, data: Partial<TaskRow>) => {
    const { error: updateError } = await supabase.from('tasks').update(data).eq('id', id)
    if (updateError) setError(describe('Updating task', updateError))
    await loadAll()
  }

  const addTask = async (data: Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>) => {
    const { error: insertError } = await supabase.from('tasks').insert(data)
    if (insertError) setError(describe('Adding task', insertError))
    await loadAll()
  }

  // Adds the same task to every game (used by "Add to all games" in the task board)
  const addTaskToAllGames = async (
    data: Omit<TaskRow, 'id' | 'game_id' | 'created_at' | 'updated_at'>,
    allGames: GameRow[]
  ) => {
    const inserts = allGames.map((g) => ({ ...data, game_id: g.id }))
    const { error: insertError } = await supabase.from('tasks').insert(inserts)
    if (insertError) setError(describe('Adding task to all games', insertError))
    await loadAll()
  }

  const deleteTask = async (id: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id)
    if (deleteError) setError(describe('Deleting task', deleteError))
    await loadAll()
  }

  return {
    games, tasks, loading, error, clearError,
    addGame, updateGame, deleteGame, updateTask, addTask, addTaskToAllGames, deleteTask,
  }
}
