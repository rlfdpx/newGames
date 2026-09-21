'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { fetchSession } from './session'
import { supabase, Person } from './supabaseClient'

const SessionContext = createContext<{ person: Person | null; loading: boolean }>({
  person: null,
  loading: true,
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadSession() {
      const session = await fetchSession()
      if (!active) return
      setPerson(session?.person ?? null)
      setLoading(false)
    }
    loadSession()
    return () => { active = false }
  }, [])

  return (
    <SessionContext.Provider value={{ person, loading }}>
      {children}
    </SessionContext.Provider>
  )
}

/** The signed-in person, or null while the session is still loading. */
export function useSession() {
  return useContext(SessionContext)
}

/**
 * Every name a person's tasks might be filed under — their display name plus
 * the aliases claimed in the `people` table. Lowercased for comparison, since
 * the legacy values were typed by hand.
 */
export function assigneeNames(person: Person | null): string[] {
  if (!person) return []
  return [person.display_name, ...person.aliases]
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * The roster, for the assignee picker. Returns an empty list if `people`
 * doesn't exist yet, so the UI falls back to free-text entry rather than
 * breaking before 001_people.sql has been run.
 */
export function usePeople() {
  const [people, setPeople] = useState<Person[]>([])

  useEffect(() => {
    let active = true
    async function loadPeople() {
      const { data } = await supabase
        .from('people')
        .select('id, email, display_name, aliases, is_admin')
        .order('display_name')
      if (active && data) setPeople(data as Person[])
    }
    loadPeople()
    return () => { active = false }
  }, [])

  return people
}
