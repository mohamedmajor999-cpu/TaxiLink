'use client'

import { useEffect, useRef, useState } from 'react'
import { getMissingQuestionIds } from '@/components/dashboard/driver/guided/guidedMissingFields'
import type { GuidedSetters } from '@/components/dashboard/driver/guided/useGuidedAnswerApplier'
import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import type { useMissionRoute } from '@/components/dashboard/driver/useMissionRoute'
import type { useMissionVoiceFiller } from '@/components/dashboard/driver/useMissionVoiceFiller'
import type { WhenMode } from './usePosterCourse'

interface Args {
  form: MissionFormState
  route: ReturnType<typeof useMissionRoute>
  voice: ReturnType<typeof useMissionVoiceFiller>
  setWhen: (m: WhenMode) => void
}

/**
 * Pilote l'enchaînement « Tout dicter » → flux guidé sur les champs manquants.
 * Sur le front de descente de `voice.isProcessing`, calcule la liste des champs
 * encore vides et bascule l'écran sur GuidedMissionFlow restreint à ces ids.
 */
export function usePosterCompleter({ form, route, voice, setWhen }: Args) {
  const [completerIds, setCompleterIds] = useState<string[] | null>(null)
  const wasProcessingRef = useRef(false)

  useEffect(() => {
    if (voice.isProcessing) {
      wasProcessingRef.current = true
      return
    }
    if (!wasProcessingRef.current) return
    wasProcessingRef.current = false
    if (voice.error) return
    const missing = getMissingQuestionIds(form)
    if (missing.length > 0) setCompleterIds(missing)
  }, [voice.isProcessing, voice.error, form])

  const guidedSetters: GuidedSetters = {
    setType: form.setType,
    setMedicalMotif: form.setMedicalMotif,
    setTransportType: form.setTransportType,
    setReturnTrip: form.setReturnTrip,
    setReturnTime: form.setReturnTime,
    setCompanion: form.setCompanion,
    setPassengers: form.setPassengers,
    setDeparture: form.setDeparture,
    setDestination: form.setDestination,
    setDate: (d) => { setWhen('later'); form.setDate(d) },
    setTime: (t) => { setWhen('later'); form.setTime(t) },
    setPatientName: form.setPatientName,
    setPhone: form.setPhone,
    setVisibility: form.setVisibility,
    setGroupIds: form.setGroupIds,
    setDepartureCoords: route.setDepartureCoords,
    setDestinationCoords: route.setDestinationCoords,
  }

  const closeCompleter = () => setCompleterIds(null)

  return { completerIds, guidedSetters, closeCompleter }
}
