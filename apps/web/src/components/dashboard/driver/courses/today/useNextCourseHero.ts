'use client'
import { useState } from 'react'
import { missionProgressMutations } from '@/services/missionProgressMutations'
import { missionService } from '@/services/missionService'
import { useMissionStore } from '@/store/missionStore'
import { getMissionProgress } from '@/lib/missionProgress'
import { buildGpsUrl, type GpsApp } from '@/lib/gpsNavigation'
import { useGpsPreference } from '../useGpsPreference'
import type { Mission } from '@/lib/supabase/types'

export type HeroStep = 'toPickup' | 'toDestination'

interface Options {
  mission: Mission
}

export function useNextCourseHero({ mission }: Options) {
  const { pref, loaded } = useGpsPreference()
  const [askPicker, setAskPicker] = useState<HeroStep | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = getMissionProgress(mission)

  // Étape courante du hero :
  //   - tant que le patient n'est pas à bord → toPickup
  //   - une fois pickup_at posé → toDestination
  const step: HeroStep = mission.pickup_at ? 'toDestination' : 'toPickup'

  const targetAddress = step === 'toPickup' ? mission.departure : mission.destination

  const launchGps = (app: GpsApp) => {
    const url = buildGpsUrl(app, targetAddress)
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const goToPickup = async () => {
    if (busy) return
    setBusy(true)
    try {
      // Si la mission est déjà IN_PROGRESS et qu'on n'a pas encore posé enroute_at,
      // on le pose pour matérialiser le départ. Si la mission est encore au statut
      // antérieur (ex: ACCEPTED non IN_PROGRESS), on laisse le startMission classique
      // s'en charger ailleurs — on ne fait que l'horodatage ici.
      if (mission.status === 'IN_PROGRESS' && !mission.enroute_at) {
        await missionProgressMutations.markEnRoute(mission.id)
      }
      if (pref === 'ask') setAskPicker('toPickup')
      else launchGps(pref)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const arrivedAtPatient = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (mission.status === 'IN_PROGRESS' && !mission.pickup_at) {
        await missionProgressMutations.markOnBoard(mission.id)
      }
      if (pref === 'ask') setAskPicker('toDestination')
      else launchGps(pref)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const goToDestination = async () => {
    if (busy) return
    if (pref === 'ask') setAskPicker('toDestination')
    else launchGps(pref)
  }

  // Filet de secours manuel quand le suivi GPS auto échoue (indoor, signal faible,
  // course trop rapide). Pose dropoff_at — la course n'est PAS encore clôturée
  // (le bouton "Course terminée" reste à cliquer après).
  const markDropped = async () => {
    if (busy || mission.dropoff_at) return
    setBusy(true)
    setError(null)
    try {
      await missionProgressMutations.markDropped(mission.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  // Clôture définitive de la course. À utiliser uniquement après dropoff (sinon
  // le serveur refuse via RLS). Vide aussi la `currentMission` côté store pour
  // que l'UI bascule sur la course suivante sans rechargement.
  const completeMission = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await missionService.complete(mission.id)
      useMissionStore.getState().dismissCurrentMission()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  return {
    progress,
    step,
    targetAddress,
    pref,
    prefLoaded: loaded,
    busy,
    error,
    askPicker,
    closeAskPicker: () => setAskPicker(null),
    goToPickup,
    arrivedAtPatient,
    goToDestination,
    markDropped,
    completeMission,
  }
}
