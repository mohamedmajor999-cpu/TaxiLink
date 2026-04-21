'use client'
import { useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { useMissionVoiceFiller } from './useMissionVoiceFiller'
import { usePartagerMissionModal } from './usePartagerMissionModal'
import { buildScheduledAt } from './missionFormHelpers'
import { buildPreviewCard, findGroupName } from './missionPreview'
import { MissionPreviewStep } from './MissionPreviewStep'
import { MissionPublishedStep } from './MissionPublishedStep'
import { MissionFormLibre } from './MissionFormLibre'
import { MissionModeToggle, type MissionCreationMode } from './MissionModeToggle'
import { GuidedMissionFlow } from './guided/GuidedMissionFlow'
import type { GuidedSetters } from './guided/useGuidedAnswerApplier'

interface Props {
  onClose: () => void
  mission?: Mission
}

export function PartagerMissionModal({ onClose, mission }: Props) {
  const f = usePartagerMissionModal(onClose, mission)
  const [mode, setMode] = useState<MissionCreationMode>('GUIDED')

  const voice = useMissionVoiceFiller({
    setType: f.setType, setMedicalMotif: f.setMedicalMotif,
    setTransportType: f.setTransportType, setReturnTrip: f.setReturnTrip,
    setReturnTime: f.setReturnTime, setCompanion: f.setCompanion,
    setPassengers: f.setPassengers,
    setDeparture: f.setDeparture, setDestination: f.setDestination,
    setDate: f.setDate, setTime: f.setTime,
    setPrice: f.setPrice, setPriceMin: f.setPriceMin, setPriceMax: f.setPriceMax,
    setPatientName: f.setPatientName, setPhone: f.setPhone,
    setVisibility: f.setVisibility, setGroupIds: f.setGroupIds,
    myGroups: f.myGroups,
    setDepartureCoords: f.setDepartureCoords,
    setDestinationCoords: f.setDestinationCoords,
  })

  if (f.published) return <MissionPublishedStep isEdit={f.isEdit} onClose={onClose} />

  if (f.preview) {
    const groupLabel =
      f.visibility === 'GROUP' && f.groupIds.length > 0
        ? (f.groupIds.length === 1 ? findGroupName(f.myGroups, f.groupIds[0]) : `${f.groupIds.length} groupes`)
        : null
    const card = buildPreviewCard({
      type: f.type, patientName: f.patientName,
      departure: f.departure, destination: f.destination,
      distanceKm: f.distanceKm, durationMin: f.durationMin,
      priceEur: f.previewFare.value, priceIsEstimated: f.previewFare.isEstimated,
      priceMinEur: f.previewFare.min, priceMaxEur: f.previewFare.max,
      scheduledAtIso: buildScheduledAt(f.date, f.time),
      groupName: groupLabel,
      medicalMotif: f.type === 'CPAM' ? f.medicalMotif : null,
    })
    return (
      <MissionPreviewStep
        card={card} isEdit={f.isEdit} saving={f.saving} error={f.error}
        onBack={f.hidePreview} onConfirm={f.submit}
      />
    )
  }

  const guidedSetters: GuidedSetters = {
    setType: f.setType, setMedicalMotif: f.setMedicalMotif,
    setTransportType: f.setTransportType, setReturnTrip: f.setReturnTrip,
    setReturnTime: f.setReturnTime, setCompanion: f.setCompanion,
    setPassengers: f.setPassengers,
    setDeparture: f.setDeparture, setDestination: f.setDestination,
    setDate: f.setDate, setTime: f.setTime,
    setPatientName: f.setPatientName, setPhone: f.setPhone,
    setVisibility: f.setVisibility, setGroupIds: f.setGroupIds,
    setDepartureCoords: f.setDepartureCoords,
    setDestinationCoords: f.setDestinationCoords,
  }

  return (
    <div className="bg-paper pb-24 md:pb-6">
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
              {f.isEdit ? 'Modifier la course' : 'Nouvelle course'}
            </h2>
            <p className="text-[12px] text-warm-500 mt-0.5">
              {mode === 'GUIDED' ? 'Assistance pas à pas' : 'Formulaire libre'}
            </p>
          </div>
          {!f.isEdit && <MissionModeToggle mode={mode} onChange={setMode} />}
        </div>
      </div>

      {mode === 'GUIDED' && !f.isEdit ? (
        <GuidedMissionFlow
          form={f}
          myGroups={f.myGroups}
          setters={guidedSetters}
          onComplete={f.showPreview}
        />
      ) : (
        <div className="px-4 md:px-8 py-4 max-w-2xl mx-auto">
          <MissionFormLibre f={f} voice={voice} />
        </div>
      )}
    </div>
  )
}
