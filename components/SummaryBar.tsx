'use client'

import { GameWithStats } from '@/lib/derive'

export default function SummaryBar({ games }: { games: GameWithStats[] }) {
  const releasing30 = games.filter(g => g.countdown !== null && g.countdown >= 0 && g.countdown <= 30).length
  const overdue     = games.filter(g => g.countdownState === 'overdue').length
  const inDev       = games.filter(g => g.overall_status === 'In Development').length
  const inQA        = games.filter(g => g.overall_status === 'In QA').length
  const totalTasks  = games.reduce((s, g) => s + g.totalTasks, 0)
  const doneTasks   = games.reduce((s, g) => s + g.completedTasks, 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px mb-8"
      style={{ border: '1px solid var(--nd-border)', borderRadius: 12, overflow: 'hidden', background: 'var(--nd-border)' }}>

      {/* Hero: total games — the Doto moment */}
      <StatCell label="Total Games" accent>
        <span className="nd-doto" style={{ fontSize: 48, lineHeight: 1, color: 'var(--nd-text-display)', letterSpacing: '-0.02em' }}>
          {games.length}
        </span>
      </StatCell>

      <StatCell label="In Dev">
        <span className="nd-mono" style={{ fontSize: 32, color: 'var(--nd-text-primary)' }}>{inDev}</span>
      </StatCell>

      <StatCell label="In QA">
        <span className="nd-mono" style={{ fontSize: 32, color: 'var(--nd-text-primary)' }}>{inQA}</span>
      </StatCell>

      <StatCell label="Releasing ≤30d">
        <span className="nd-mono" style={{ fontSize: 32, color: releasing30 > 0 ? 'var(--nd-warning)' : 'var(--nd-text-primary)' }}>
          {releasing30}
        </span>
      </StatCell>

      <StatCell label="Overdue">
        <span className="nd-mono" style={{ fontSize: 32, color: overdue > 0 ? 'var(--nd-accent)' : 'var(--nd-text-primary)' }}>
          {overdue}
        </span>
      </StatCell>

      <StatCell label="Tasks Done">
        <span className="nd-mono" style={{ fontSize: 24, color: 'var(--nd-success)' }}>{doneTasks}</span>
        <span className="nd-label" style={{ marginTop: 2 }}>/ {totalTasks}</span>
      </StatCell>
    </div>
  )
}

function StatCell({ label, children, accent = false }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-2 p-4"
      style={{ background: accent ? 'var(--nd-surface-raised)' : 'var(--nd-surface)' }}>
      <div className="nd-label">{label}</div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}
