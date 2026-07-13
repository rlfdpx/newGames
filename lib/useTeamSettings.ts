'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, TeamSettings } from './supabaseClient'

const DEFAULTS: Record<string, TeamSettings> = {
  haiti:   { team_slug: 'haiti',   display_name: 'Haiti Lotomobil', description: null },
  nigeria: { team_slug: 'nigeria', display_name: 'Nigeria',         description: null },
  ghana:   { team_slug: 'ghana',   display_name: 'Ghana',           description: null },
}

export function useTeamSettings(teamSlug: string) {
  const fallback = DEFAULTS[teamSlug] ?? { team_slug: teamSlug, display_name: teamSlug, description: null }
  const [settings, setSettings] = useState<TeamSettings>(fallback)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('team_settings')
      .select('*')
      .eq('team_slug', teamSlug)
      .single()
    if (data) setSettings(data)
  }, [teamSlug])

  useEffect(() => { load() }, [load])

  const save = async (patch: Partial<Pick<TeamSettings, 'display_name' | 'description'>>) => {
    setSaving(true)
    try {
      await supabase
        .from('team_settings')
        .upsert({ ...settings, ...patch, team_slug: teamSlug })
      await load()
    } finally { setSaving(false) }
  }

  return { settings, save, saving }
}

export function useAllTeamSettings(slugs: string[]) {
  const [all, setAll] = useState<Record<string, TeamSettings>>(DEFAULTS)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('team_settings').select('*').in('team_slug', slugs)
    if (data && data.length > 0) {
      setAll(prev => {
        const next = { ...prev }
        data.forEach(s => { next[s.team_slug] = s })
        return next
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs.join(',')])

  useEffect(() => { load() }, [load])

  const save = async (teamSlug: string, patch: Partial<Pick<TeamSettings, 'display_name' | 'description'>>) => {
    const current = all[teamSlug] ?? DEFAULTS[teamSlug]
    setSaving(true)
    try {
      await supabase
        .from('team_settings')
        .upsert({ ...current, ...patch, team_slug: teamSlug })
      await load()
    } finally { setSaving(false) }
  }

  return { all, save, saving }
}
