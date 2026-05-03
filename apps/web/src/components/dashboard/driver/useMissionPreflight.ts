'use client'
import { useEffect, useRef, useState } from 'react'
import { userPrefsService, type MissionDefaults } from '@/services/userPrefsService'
import type { MissionFormType } from './missionFormHelpers'
import type { MissionVisibility } from '@/lib/validators'

interface Args {
  isEdit: boolean
  driverId: string | null
  setType: (t: MissionFormType) => void
  setVisibility: (v: MissionVisibility) => void
  setGroupIds: (ids: string[] | ((prev: string[]) => string[])) => void
}

/**
 * Préréglages de création d'annonce : charge les défauts (type + visibilité +
 * groupes) depuis le profil au montage et les pousse dans le form-state. Gère
 * aussi l'état du "sas" qui force la sélection groupe + type avant que le
 * micro et le formulaire ne soient utilisables. Skippé en mode édition.
 */
export function useMissionPreflight({ isEdit, driverId, setType, setVisibility, setGroupIds }: Args) {
  const [gatePassed, setGatePassed] = useState(isEdit)
  const [defaults, setDefaults] = useState<MissionDefaults | null>(null)
  const [defaultsLoaded, setDefaultsLoaded] = useState(false)
  const seededRef = useRef(false)

  useEffect(() => {
    if (isEdit || !driverId || seededRef.current) return
    seededRef.current = true
    let cancelled = false
    userPrefsService.getMissionDefaults()
      .then((d) => {
        if (cancelled) return
        setDefaults(d)
        if (d.type) setType(d.type)
        if (d.visibility) setVisibility(d.visibility)
        if (d.visibility === 'GROUP' && d.groupIds.length > 0) {
          setGroupIds(d.groupIds)
        } else if (d.visibility === 'PUBLIC') {
          setGroupIds([])
        }
      })
      .catch(() => { /* silencieux : pref pas critique */ })
      .finally(() => { if (!cancelled) setDefaultsLoaded(true) })
    return () => { cancelled = true }
  }, [isEdit, driverId, setType, setVisibility, setGroupIds])

  const passGate = (snapshot: MissionDefaults, remember: boolean) => {
    setGatePassed(true)
    if (!remember) return
    userPrefsService.updateMissionDefaults(snapshot)
      .then(() => setDefaults(snapshot))
      .catch(() => { /* silencieux */ })
  }

  const resetGate = () => setGatePassed(false)

  const matchesSavedDefaults = (snapshot: MissionDefaults): boolean => {
    if (!defaults) return false
    if (defaults.type !== snapshot.type) return false
    if (defaults.visibility !== snapshot.visibility) return false
    const a = [...defaults.groupIds].sort()
    const b = [...snapshot.groupIds].sort()
    if (a.length !== b.length) return false
    return a.every((id, i) => id === b[i])
  }

  return { gatePassed, passGate, resetGate, defaults, defaultsLoaded, matchesSavedDefaults }
}
