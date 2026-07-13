import { createClient } from '@supabase/supabase-js'

// Supabase throws if the URL isn't http/https. During build the env vars are placeholder strings,
// so we guard with a format check and fall back to a no-op URL.
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const url = /^https?:\/\//.test(rawUrl) ? rawUrl : 'https://placeholder.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'

export const supabase = createClient(url, key)

export type GameRow = {
  id: string
  game_name: string
  code_name: string | null
  overall_status: string
  release_date: string | null
  notes: string | null
  sort_order: number
  team: string
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export type TeamSettings = {
  team_slug: string
  display_name: string
  description: string | null
}

export type TaskRow = {
  id: string
  game_id: string
  category: string
  name: string
  status: string
  assignee: string | null
  start_date: string | null
  end_date: string | null
  priority: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}
