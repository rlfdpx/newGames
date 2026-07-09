import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const TASK_NAME = 'Customer service training'
const CATEGORY = '5. Launch & Follow-up'

async function main() {
  const { data: games, error: gErr } = await supabase.from('games').select('id, code_name, game_name')
  if (gErr) throw gErr

  // Find games that don't already have this task
  const { data: existing } = await supabase
    .from('tasks')
    .select('game_id')
    .eq('name', TASK_NAME)
    .eq('category', CATEGORY)

  const alreadyHave = new Set((existing ?? []).map((t: { game_id: string }) => t.game_id))
  const toInsert = (games ?? []).filter((g: { id: string }) => !alreadyHave.has(g.id))

  if (toInsert.length === 0) {
    console.log('All games already have this task.')
    return
  }

  const inserts = toInsert.map((g: { id: string }, i: number) => ({
    game_id: g.id,
    category: CATEGORY,
    name: TASK_NAME,
    status: 'Not Started',
    priority: 'High',
    sort_order: 200 + i,
  }))

  const { error } = await supabase.from('tasks').insert(inserts)
  if (error) throw error

  console.log(`Added "${TASK_NAME}" to ${toInsert.length} game(s):`)
  toInsert.forEach((g: { code_name: string | null; game_name: string }) =>
    console.log(`  • ${g.code_name ?? g.game_name}`)
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
