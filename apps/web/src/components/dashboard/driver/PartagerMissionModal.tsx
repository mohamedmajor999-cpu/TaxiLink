'use client'
import { useMemo, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { useMissionVoiceFiller } from './useMissionVoiceFiller'
import { usePartagerMissionModal } from './usePartagerMissionModal'
import { buildScheduledAt } from './missionFormHelpers'
import { buildPreviewCard, findGroupName } from './missionPreview'
import { MissionPreviewStep } from './MissionPreviewStep'
import { MissionFormLibre, getLibreFieldAnchor } from './MissionFormLibre'
import { MissionFormVocal } from './MissionFormVocal'
import { MissionModeToggle, type MissionCreationMode } from './MissionModeToggle'
import { GuidedMissionFlow } from './guided/GuidedMissionFlow'
import type { GuidedSetters } from './guided/useGuidedAnswerApplier'
import { getVisibleQuestions } from './guided/guidedQuestions'

interface Props {
  onClose: () => void
  mission?: Mission
}

export function PartagerMissionModal({ onClose, mission }: Props) {
  const f = usePartagerMissionModal(onClose, mission)
  const [mode, setMode] = useState<MissionCreationMode>('FREE')
  const [editFieldId, setEditFieldId] = useState<string | null>(null)

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

  const visibleQuestions = useMemo(
    () => getVisibleQuestions({ type: f.type, returnTrip: f.returnTrip, visibility: f.visibility }),
    [f.type, f.returnTrip, f.visibility],
  )

  const groupLabel =
    f.visibility === 'GROUP' && f.groupIds.length > 0
      ? (f.groupIds.length === 1 ? findGroupName(f.myGroups, f.groupIds[0]) : `${f.groupIds.length} groupes`)
      : null
  const card = buildPreviewCard({
    type: f.type,
    departure: f.departure, destination: f.destination,
    distanceKm: f.distanceKm, durationMin: f.durationMin,
    priceEur: f.previewFare.value, priceIsEstimated: f.previewFare.isEstimated,
    priceMinEur: f.previewFare.min, priceMaxEur: f.previewFare.max,
    scheduledAtIso: buildScheduledAt(f.date, f.time),
    groupName: groupLabel,
    medicalMotif: f.type === 'CPAM' ? f.medicalMotif : null,
  })

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

  const isGuided = mode === 'GUIDED' && !f.isEdit
  const isVocal = mode === 'VOCAL' && !f.isEdit
  const onEditField = (id: string) => {
    f.hidePreview()
    if (isGuided) {
      setEditFieldId(id)
      return
    }
    // Depuis Mains libres : on bascule en Semi-libre pour exposer le formulaire éditable.
    if (isVocal) setMode('FREE')
    const anchor = getLibreFieldAnchor(id)
    if (!anchor) return
    setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const vocalSnapshot = () => ({
    type: f.type, medicalMotif: f.medicalMotif,
    departure: f.departure, destination: f.destination,
  })

  return (
    <div className="bg-paper pb-24 md:pb-6">
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
              {f.isEdit ? 'Modifier la course' : 'Nouvelle course'}
            </h2>
            <p className="text-[12px] text-warm-500 mt-0.5">
              {f.preview
                ? 'Aperçu avant publication'
                : mode === 'GUIDED' ? 'Assistance pas à pas'
                : mode === 'VOCAL' ? 'Dictée mains libres'
                : 'Formulaire libre'}
            </p>
          </div>
          {!f.isEdit && !f.preview && <MissionModeToggle mode={mode} onChange={setMode} />}
        </div>
      </div>

      {/* Flux guidé : monté en continu pour préserver la position quand l'aperçu se ferme. */}
      {isGuided && (
        <div className={f.preview ? 'hidden' : ''}>
          <GuidedMissionFlow
            form={f}
            myGroups={f.myGroups}
            setters={guidedSetters}
            onComplete={f.showPreview}
            editFieldId={editFieldId}
            onEditHandled={() => setEditFieldId(null)}
          />
        </div>
      )}
      {!isGuided && !isVocal && !f.preview && (
        <div className="px-4 md:px-8 py-4 max-w-2xl mx-auto">
          <MissionFormLibre f={f} voice={voice} />
        </div>
      )}
      {isVocal && !f.preview && (
        <MissionFormVocal filler={voice} snapshot={vocalSnapshot} onComplete={f.showPreview} />
      )}

      {f.preview && (
        <MissionPreviewStep
          card={card} isEdit={f.isEdit} saving={f.saving} error={f.error}
          onBack={f.hidePreview} onConfirm={f.submit}
          departureCoords={f.departureCoords}
          destinationCoords={f.destinationCoords}
          routeGeometry={f.routeGeometry}
          form={f}
          myGroups={f.myGroups}
          visibleQuestions={visibleQuestions}
          onEditField={onEditField}
        />
      )}
    </div>
  )
}
