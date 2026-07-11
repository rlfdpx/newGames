import { GameRow, TaskRow } from './supabaseClient'
import { daysBetween, today } from './dates'

export type CountdownState = 'overdue' | 'urgent' | 'soon' | 'future' | 'none'

export type GameWithStats = GameRow & {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  progressPct: number
  countdown: number | null   // days until release (negative = past)
  countdownState: CountdownState
}

export function deriveGame(game: GameRow, tasks: TaskRow[]): GameWithStats {
  const gameTasks = tasks.filter((t) => t.game_id === game.id)
  const total = gameTasks.length
  const completed = gameTasks.filter((t) => t.status === 'Completed').length
  const inProgress = gameTasks.filter((t) => t.status === 'In Progress').length

  let countdown: number | null = null
  let countdownState: CountdownState = 'none'

  if (game.release_date) {
    countdown = daysBetween(today(), game.release_date)
    if (countdown < 0 && game.overall_status !== 'Released') {
      countdownState = 'overdue'
    } else if (countdown >= 0 && countdown <= 7) {
      countdownState = 'urgent'
    } else if (countdown > 7 && countdown <= 30) {
      countdownState = 'soon'
    } else if (countdown > 30) {
      countdownState = 'future'
    }
  }

  return {
    ...game,
    totalTasks: total,
    completedTasks: completed,
    inProgressTasks: inProgress,
    progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
    countdown,
    countdownState,
  }
}

export function countdownLabel(g: GameWithStats): string {
  if (g.countdown === null) return '—'
  if (g.countdown === 0) return 'Today'
  if (g.countdown > 0) return `In ${g.countdown} day${g.countdown === 1 ? '' : 's'}`
  const daysAgo = Math.abs(g.countdown)
  if (g.overall_status === 'Released') return `Released ${daysAgo}d ago`
  return `Overdue by ${daysAgo} day${daysAgo === 1 ? '' : 's'}`
}

export function isTaskOverdue(task: TaskRow): boolean {
  if (!task.end_date || task.status === 'Completed') return false
  return daysBetween(today(), task.end_date) < 0
}
