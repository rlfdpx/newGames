'use client'

import { GameWithStats } from '@/lib/derive'

const STATUSES = ['In Development', 'In QA', 'Released', 'On Hold', 'Cancelled']

export default function SummaryBar({ games }: { games: GameWithStats[] }) {
  const releasing30 = games.filter(
    (g) => g.countdown !== null && g.countdown >= 0 && g.countdown <= 30
  ).length
  const overdue = games.filter((g) => g.countdownState === 'overdue').length
  const totalTasks = games.reduce((s, g) => s + g.totalTasks, 0)
  const completedTasks = games.reduce((s, g) => s + g.completedTasks, 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      <StatCard label="Total Games" value={games.length} color="blue" />
      {STATUSES.slice(0, 2).map((s) => (
        <StatCard
          key={s}
          label={s}
          value={games.filter((g) => g.overall_status === s).length}
          color={s === 'In QA' ? 'purple' : 'gray'}
        />
      ))}
      <StatCard label="Releasing ≤30d" value={releasing30} color="amber" />
      <StatCard label="Overdue" value={overdue} color="red" />
      <StatCard
        label="Tasks Done"
        value={`${completedTasks}/${totalTasks}`}
        color="green"
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    gray:   'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
    purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    amber:  'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    red:    'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    green:  'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
  }
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${colors[color]}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium opacity-70">{label}</span>
    </div>
  )
}
