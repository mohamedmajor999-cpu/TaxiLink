'use client'
import { useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { missionService } from '@/services/missionService'
import { getMissionProgress, type MissionProgressStep } from '@/lib/missionProgress'

// Hook reutilisable qui expose l'etape courante d'une mission et un seul
// handler `advanceStep` qui declenche la bonne mutation selon l'etape
// (accepted → enroute, enroute → onboard, onboard → dropped). La cloture
// finale (DONE) n'est PAS deleguee a ce hook : elle reste l'action explicite
// `complete` portee par chaque ecran.

export function useMissionProgressActions(
  mission: Mission | null,
  onLocalUpdate: (next: Mission) => void,
  onError?: (message: string) => void,
): {
  step: MissionProgressStep
  advanceStep: () => Promise<void>
  advancing: boolean
} {
  const [advancing, setAdvancing] = useState(false)
  const step = mission ? getMissionProgress(mission) : 'accepted'

  const advanceStep = async () => {
    if (!mission || advancing) return
    setAdvancing(true)
    try {
      const ts = new Date().toISOString()
      if (step === 'accepted') {
        await missionService.markEnRoute(mission.id)
        onLocalUpdate({ ...mission, enroute_at: ts })
      } else if (step === 'enroute') {
        await missionService.markOnBoard(mission.id)
        onLocalUpdate({ ...mission, pickup_at: ts })
      } else if (step === 'onboard') {
        await missionService.markDropped(mission.id)
        onLocalUpdate({ ...mission, dropoff_at: ts })
      }
    } catch (err) {
      // Avant : try/finally sans catch -> Promise rejetee swallow dans React,
      // user voit le bouton se reactiver sans message ni changement d'etape.
      onError?.(err instanceof Error ? err.message : "Impossible d'avancer la course")
    } finally {
      setAdvancing(false)
    }
  }

  return { step, advanceStep, advancing }
}
