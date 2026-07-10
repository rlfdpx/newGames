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

export default function RecentActivity({
  tasks,
  games,
}: {
  tasks: TaskRow[]
  games: GameRow[]
}) {
  const gameMap = Object.fromEntries(games.map((g) => [g.id, g]))

  // Last 8 completed tasks sorted by updated_at desc
  const recent = [...tasks]
    .filter((t) => t.status === 'Completed')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8)

  if (recent.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Recently Completed
      </h2>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {recent.map((task) => {
          const game = gameMap[task.game_id]
          if (!game) return null
          return (
            <Link
              key={task.id}
              href={`/game/${game.id}`}
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex flex-col gap-1.5 hover:border-green-400 dark:hover:border-green-600 hover:shadow-sm transition-all"
            >
              {/* Task name + check */}
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 text-[10px]">
                  ✓
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                  {task.name}
                </span>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2 pl-6 flex-wrap">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {game.code_name ?? game.game_name}
                </span>
                {task.assignee && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[90px]">
                      {task.assignee}
                    </span>
                  </>
                )}
                <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  {timeAgo(task.updated_at)}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
