'use client'
import { useMemo, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { useMissionVoiceFiller } from './useMissionVoiceFiller'
import { usePartagerMissionModal } from './usePartagerMissionModal'
import { useMissionPreflight } from './useMissionPreflight'
import { MissionPreflight } from './MissionPreflight'
import { buildScheduledAt } from './missionFormHelpers'
import { buildPreviewCard, findGroupName } from './missionPreview'
import { MissionPreviewStep } from './MissionPreviewStep'
import { MissionFormLibre, getLibreFieldAnchor } from './MissionFormLibre'
import { MissionFormVocal } from './MissionFormVocal'
import { MissionLivePreview } from './MissionLivePreview'
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
  const preflight = useMissionPreflight({
    isEdit: f.isEdit,
    driverId: f.driverId,
    setType: f.setType,
    setVisibility: f.setVisibility,
    setGroupIds: f.setGroupIds,
  })
  const preflightSnapshot = { type: f.type, visibility: f.visibility, groupIds: f.groupIds }
  const showPreflight = !f.isEdit && !preflight.gatePassed && !f.preview

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

  const showLibreSplit = !isGuided && !isVocal && !f.preview && !showPreflight
  const scheduledAtIso = buildScheduledAt(f.date, f.time)

  return (
    <div className="bg-paper pb-24 md:pb-6">
      <div className={`px-4 md:px-8 pt-4 md:pt-6 pb-2 mx-auto ${showLibreSplit ? 'max-w-2xl lg:max-w-6xl' : 'max-w-2xl lg:max-w-4xl'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] lg:text-[26px] font-bold text-ink leading-tight tracking-tight">
              {f.isEdit ? 'Modifier la course' : 'Nouvelle course'}
            </h2>
            <p className="text-[12px] lg:text-[13px] text-warm-500 mt-0.5">
              {f.preview
                ? 'Aperçu avant publication'
                : mode === 'GUIDED' ? 'Assistance pas à pas'
                : mode === 'VOCAL' ? 'Dictée mains libres'
                : 'Formulaire libre'}
            </p>
          </div>
          {!f.isEdit && !f.preview && !showPreflight && <MissionModeToggle mode={mode} onChange={setMode} />}
        </div>
      </div>

      {showPreflight && (
        <MissionPreflight
          myGroups={f.myGroups}
          type={f.type}
          visibility={f.visibility}
          groupIds={f.groupIds}
          onChangeType={(t) => { f.setType(t); if (t === 'PRIVE') f.setMedicalMotif(null) }}
          onSelectPublic={f.onSelectPublic}
          onToggleGroup={f.onToggleGroup}
          defaultsRemembered={preflight.matchesSavedDefaults(preflightSnapshot)}
          onContinue={(remember) => preflight.passGate(preflightSnapshot, remember)}
        />
      )}

      {/* Flux guidé : monté en continu pour préserver la position quand l'aperçu se ferme. */}
      {isGuided && !showPreflight && (
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
      {showLibreSplit && (
        <div className="px-4 md:px-8 py-4 max-w-2xl lg:max-w-6xl mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:items-start">
          <div className="min-w-0">
            <MissionFormLibre f={f} voice={voice} />
          </div>
          <aside className="hidden lg:block lg:sticky lg:top-6">
            <MissionLivePreview f={f} groupLabel={groupLabel} scheduledAtIso={scheduledAtIso} />
          </aside>
        </div>
      )}
      {isVocal && !f.preview && !showPreflight && (
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
