'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { userPrefsService, type MissionDefaults } from '@/services/userPrefsService'
import type { Group } from '@taxilink/core'
import type { MissionVisibility } from '@/lib/validators'
import type { MissionFormType } from '@/components/dashboard/driver/missionFormHelpers'

interface Args {
  driverId: string | null
  myGroups: Group[]
  type: MissionFormType
  visibility: MissionVisibility
  groupIds: string[]
  setType: (t: MissionFormType) => void
  setVisibility: (v: MissionVisibility) => void
  setGroupIds: (ids: string[] | ((prev: string[]) => string[])) => void
}

/**
 * Sas obligatoire qui force la selection groupe + type avant que le micro
 * et le formulaire principal ne soient utilisables. Charge les prereglages
 * (mission_defaults) et les pousse dans le form-state si presents. Garde
 * un snapshot pour comparer le choix courant aux prereglages sauvegardes.
 */
export function usePosterPreflight({
  driverId, myGroups, type, visibility, groupIds,
  setType, setVisibility, setGroupIds,
}: Args) {
  const [gatePassed, setGatePassed] = useState(false)
  const [savedDefaults, setSavedDefaults] = useState<MissionDefaults | null>(null)
  const seededRef = useRef(false)

  useEffect(() => {
    if (!driverId || seededRef.current) return
    if (myGroups.length === 0 && driverId) {
      // attend le chargement des groupes par usePosterCourse pour eviter
      // de filtrer les groupIds preregles avec une liste vide.
      return
    }
    seededRef.current = true
    let cancelled = false
    userPrefsService.getMissionDefaults()
      .then((prefs) => {
        if (cancelled) return
        setSavedDefaults(prefs)
        if (prefs.type) setType(prefs.type)
        if (prefs.visibility) setVisibility(prefs.visibility)
        if (prefs.visibility === 'GROUP' && prefs.groupIds.length > 0) {
          setGroupIds(prefs.groupIds.filter((id) => myGroups.some((g) => g.id === id)))
        } else if (prefs.visibility === 'PUBLIC') {
          setGroupIds([])
        }
      })
      .catch(() => { /* silencieux : pref pas critique */ })
    return () => { cancelled = true }
  }, [driverId, myGroups, setType, setVisibility, setGroupIds])

  const passGate = (remember: boolean) => {
    setGatePassed(true)
    if (!remember) return
    const snapshot: MissionDefaults = { type, visibility, groupIds }
    userPrefsService.updateMissionDefaults(snapshot)
      .then(() => setSavedDefaults(snapshot))
      .catch(() => { /* silencieux */ })
  }

  const matchesSavedDefaults = useMemo(() => {
    if (!savedDefaults) return false
    if (savedDefaults.type !== type) return false
    if (savedDefaults.visibility !== visibility) return false
    const a = [...savedDefaults.groupIds].sort()
    const b = [...groupIds].sort()
    if (a.length !== b.length) return false
    return a.every((id, i) => id === b[i])
  }, [savedDefaults, type, visibility, groupIds])

  return { gatePassed, passGate, matchesSavedDefaults }
}
