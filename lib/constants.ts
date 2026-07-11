// Shared enums + color maps for game/task statuses and task priority.
// Consolidated here so the dropdown options and pill colors used across
// GameForm, FilterBar, GameCard, the game detail page, and TaskRow stay
// in sync instead of drifting between copies.

export const GAME_STATUSES = ['In Development', 'In QA', 'Released', 'On Hold', 'Cancelled']

export const GAME_STATUS_COLORS: Record<string, string> = {
  'In Development': 'var(--nd-interactive)',
  'In QA':          'var(--nd-warning)',
  'Released':       'var(--nd-success)',
  'On Hold':        'var(--nd-text-disabled)',
  'Cancelled':      'var(--nd-accent)',
}

export const TASK_STATUSES = ['Not Started', 'In Progress', 'Completed']

export const TASK_STATUS_COLORS: Record<string, string> = {
  'Completed':   'var(--nd-success)',
  'In Progress': 'var(--nd-warning)',
  'Not Started': 'var(--nd-text-disabled)',
}

export const TASK_PRIORITIES = ['High', 'Medium', 'Low']

export const TASK_PRIORITY_OPTIONS = ['', ...TASK_PRIORITIES]

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  High:   'var(--nd-accent)',
  Medium: 'var(--nd-warning)',
  Low:    'var(--nd-text-disabled)',
}
