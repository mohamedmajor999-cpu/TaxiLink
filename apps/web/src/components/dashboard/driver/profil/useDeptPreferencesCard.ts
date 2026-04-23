'use client'
import { useState, useEffect, useMemo } from 'react'
import { useDeptPreferences } from '@/hooks/useDeptPreferences'

export function useDeptPreferencesCard() {
  const { depts, loading, save: savePrefs } = useDeptPreferences()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Synchronise la sélection locale quand les prefs serveur arrivent.
  useEffect(() => {
    setSelected(new Set(depts))
  }, [depts])

  const dirty = useMemo(() => {
    if (selected.size !== depts.length) return true
    return !depts.every((d) => selected.has(d))
  }, [selected, depts])

  const toggle = (code: string) => {
    setSaved(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await savePrefs(Array.from(selected))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return { selected, dirty, loading, saving, saved, error, toggle, save }
}
