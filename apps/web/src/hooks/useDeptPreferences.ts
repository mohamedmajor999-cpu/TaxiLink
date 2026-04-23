'use client'

import { useEffect, useState, useCallback } from 'react'
import { userPrefsService } from '@/services/userPrefsService'

// Référence stable pour l'état "vide" — évite que setDepts([]) crée une
// nouvelle référence et déclenche des re-fetch en cascade dans les consumers
// qui mettent `depts` en deps d'un useEffect.
const EMPTY: readonly string[] = Object.freeze([])

/**
 * Départements sélectionnés par le chauffeur pour recevoir des missions.
 * Liste vide ⇒ aucun filtre (voir toutes les missions).
 */
export function useDeptPreferences() {
  const [depts, setDepts] = useState<readonly string[]>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    userPrefsService.getDeptPreferences().then((v) => {
      if (!active) return
      setDepts(v.length === 0 ? EMPTY : v)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const save = useCallback(async (next: string[]) => {
    await userPrefsService.updateDeptPreferences(next)
    setDepts(next.length === 0 ? EMPTY : next)
  }, [])

  return { depts: depts as string[], loading, save }
}
