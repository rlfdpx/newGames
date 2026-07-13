'use client'

import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

const LABELS: Record<Theme, string> = {
  system: '[AUTO]',
  light:  '[LIGHT]',
  dark:   '[DARK]',
}

const CYCLE: Record<Theme, Theme> = {
  system: 'light',
  light:  'dark',
  dark:   'system',
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('nd-theme')
    if (stored === 'light' || stored === 'dark') setTheme(stored)
  }, [])

  const toggle = () => {
    const next = CYCLE[theme]
    setTheme(next)
    if (next === 'system') {
      delete document.documentElement.dataset.theme
      localStorage.removeItem('nd-theme')
    } else {
      document.documentElement.dataset.theme = next
      localStorage.setItem('nd-theme', next)
    }
  }

  return (
    <button
      onClick={toggle}
      className="nd-btn-ghost"
      title="Toggle color theme"
      style={{ fontSize: 11, letterSpacing: '0.08em' }}
    >
      {LABELS[theme]}
    </button>
  )
}
