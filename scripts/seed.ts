import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SHEET_ID = '1cHuvHs0-mFSMaM4_qw91ovxU1w6HMlCNW_6JHaqqDMo'

const GAME_TABS: Array<{ codeName: string; gid: string }> = [
  { codeName: 'Mancala',        gid: '0' },
  { codeName: 'Heads and Tail', gid: '1161491265' },
  { codeName: 'Happy Hour',     gid: '1805252839' },
  { codeName: 'Scratch',        gid: '1488332516' },
  { codeName: "Baron's Gold",   gid: '2069423424' },
]

const PORTFOLIO_GID = '123456789'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function fetchCSV(gid: string): Promise<string[][]> {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching gid=${gid}`)
  const text = await res.text()
  return text.split('\n').map((line) => line.split(',').map((c) => c.trim().replace(/^"|"$/g, '')))
}

function parseDMY(raw: string): string | null {
  if (!raw) return null
  const parts = raw.trim().split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map((p) => p.trim().padStart(2, '0'))
  return y.length === 4 ? `${y}-${m}-${d}` : null
}

async function seedPortfolio() {
  const rows = await fetchCSV(PORTFOLIO_GID)
  const header = rows.findIndex((r) => r.join('').includes('Game Name'))
  if (header === -1) throw new Error('Could not find portfolio header row')

  const dataRows = rows.slice(header + 1).filter((r) => r[1]?.trim())

  const games = dataRows.map((r, i) => ({
    game_name:      r[1]?.trim() || `Game ${i + 1}`,
    code_name:      r[2]?.trim() || null,
    overall_status: r[3]?.trim() || 'In Development',
    release_date:   parseDMY(r[5]),
    notes:          r[6]?.trim() || null,
    sort_order:     i,
    team:           'haiti',
  }))

  // Clear only Haiti games (tasks cascade-delete via FK); other teams are untouched
  await supabase.from('games').delete().eq('team', 'haiti')

  console.log(`Inserting ${games.length} games…`)
  const { data, error } = await supabase.from('games').insert(games).select()
  if (error) throw error
  return data ?? []
}

async function seedTasks(gameRows: Array<{ id: string; code_name: string | null }>) {
  const codeNameToId = Object.fromEntries(
    gameRows.filter((g) => g.code_name).map((g) => [g.code_name!, g.id])
  )

  for (const tab of GAME_TABS) {
    const gameId = codeNameToId[tab.codeName]
    if (!gameId) {
      console.warn(`  Skipping ${tab.codeName} — no matching game in DB`)
      continue
    }

    const rows = await fetchCSV(tab.gid)
    const header = rows.findIndex((r) => r.join('').toLowerCase().includes('task') && r.join('').toLowerCase().includes('status'))
    if (header === -1) { console.warn(`  No task header in ${tab.codeName}`); continue }

    let category = ''
    let sortOrder = 0
    const tasks: object[] = []

    for (const row of rows.slice(header + 1)) {
      const col1 = row[1]?.trim()
      if (!col1) continue

      // Category header: starts with a digit and dot
      if (/^\d+\./.test(col1) && !row[2]?.trim()) {
        category = col1
        continue
      }

      if (!category) continue

      tasks.push({
        game_id:    gameId,
        category,
        name:       col1,
        status:     row[2]?.trim() || 'Not Started',
        assignee:   row[3]?.trim() || null,
        start_date: parseDMY(row[4]),
        end_date:   parseDMY(row[5]),
        priority:   row[6]?.trim() || null,
        notes:      row[7]?.trim() || null,
        sort_order: sortOrder++,
      })
    }

    if (tasks.length === 0) continue

    // Delete existing tasks for this game before re-inserting (clean re-seed)
    await supabase.from('tasks').delete().eq('game_id', gameId)

    const { error } = await supabase.from('tasks').insert(tasks)
    if (error) throw error
    console.log(`  ${tab.codeName}: ${tasks.length} tasks inserted`)
  }
}

async function main() {
  console.log('Seeding games…')
  const games = await seedPortfolio()
  console.log('Seeding tasks…')
  await seedTasks(games as Array<{ id: string; code_name: string | null }>)
  console.log('Done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
