'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, GameRow, TaskRow } from './supabaseClient'
import { TASK_TEMPLATE } from './taskTemplate'

export function useGames() {
  const [games, setGames] = useState<GameRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    const [{ data: g }, { data: t }] = await Promise.all([
      supabase.from('games').select('*').order('sort_order').order('created_at'),
      supabase.from('tasks').select('*').order('sort_order'),
    ])
    setGames(g ?? [])
    setTasks(t ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadAll])

  // --- Games CRUD ---
  const addGame = async (data: Omit<GameRow, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: game, error } = await supabase
      .from('games')
      .insert(data)
      .select()
      .single()
    if (error || !game) throw error
    // Seed standard task template
    const templateTasks = TASK_TEMPLATE.map((t) => ({
      game_id: game.id,
      category: t.category,
      name: t.name,
      priority: t.priority,
      sort_order: t.sort_order,
      status: 'Not Started',
    }))
    await supabase.from('tasks').insert(templateTasks)
    await loadAll()
    return game
  }

  const updateGame = async (id: string, data: Partial<GameRow>) => {
    await supabase.from('games').update(data).eq('id', id)
    await loadAll()
  }

  const deleteGame = async (id: string) => {
    await supabase.from('games').delete().eq('id', id)
    await loadAll()
  }

  // --- Tasks CRUD ---
  const updateTask = async (id: string, data: Partial<TaskRow>) => {
    await supabase.from('tasks').update(data).eq('id', id)
    await loadAll()
  }

  const addTask = async (data: Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>) => {
    await supabase.from('tasks').insert(data)
    await loadAll()
  }

  // Adds the same task to every game (used by "Add to all games" in the task board)
  const addTaskToAllGames = async (
    data: Omit<TaskRow, 'id' | 'game_id' | 'created_at' | 'updated_at'>,
    allGames: GameRow[]
  ) => {
    const inserts = allGames.map((g) => ({ ...data, game_id: g.id }))
    await supabase.from('tasks').insert(inserts)
    await loadAll()
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    await loadAll()
  }

  return { games, tasks, loading, addGame, updateGame, deleteGame, updateTask, addTask, addTaskToAllGames, deleteTask }
}
