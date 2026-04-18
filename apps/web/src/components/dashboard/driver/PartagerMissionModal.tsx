'use client'
import { ArrowRight, AlertCircle, Navigation } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { useMissionVoiceFiller } from './useMissionVoiceFiller'
import { usePartagerMissionModal } from './usePartagerMissionModal'
import { MissionVisibilityField } from './MissionVisibilityField'
import { AddressField } from './AddressField'
import { FieldCard, Chip } from './MissionFormPrimitives'
import { VoiceMicButton } from './VoiceMicButton'
import { MissionPreviewStep } from './MissionPreviewStep'
import { MissionPublishedStep } from './MissionPublishedStep'
import { buildScheduledAt } from './missionFormHelpers'
import { buildPreviewCard, findGroupName } from './missionPreview'
import { FareEstimateButton } from './FareEstimateButton'
import { DateTimeFields } from './DateTimeFields'

interface Props {
  onClose: () => void
  mission?: Mission
}

export function PartagerMissionModal({ onClose, mission }: Props) {
  const {
    isEdit, type, setType, medicalMotif, setMedicalMotif,
    visibility, setVisibility, groupId, setGroupId, myGroups,
    departure, setDeparture, destination, setDestination,
    onSelectDeparture, onSelectDestination,
    setDepartureCoords, setDestinationCoords,
    distanceKm, durationMin, loadingRoute,
    date, setDate, time, setTime, price, setPrice, previewFare, patientName, setPatientName,
    preview, showPreview, hidePreview,
    published,
    saving, error, canSubmit, submit,
  } = usePartagerMissionModal(onClose, mission)

  const voice = useMissionVoiceFiller({
    setType, setMedicalMotif, setDeparture, setDestination, setDate, setTime, setPrice,
    setPatientName, setDepartureCoords, setDestinationCoords,
  })

  if (published) {
    return <MissionPublishedStep isEdit={isEdit} onClose={onClose} />
  }

  if (preview) {
    const card = buildPreviewCard({
      type, patientName, departure, destination, distanceKm, durationMin,
      priceEur: previewFare.value, priceIsEstimated: previewFare.isEstimated,
      scheduledAtIso: buildScheduledAt(date, time),
      groupName: visibility === 'GROUP' ? findGroupName(myGroups, groupId) : null,
      medicalMotif: type === 'CPAM' ? medicalMotif : null,
    })
    return (
      <MissionPreviewStep
        card={card}
        isEdit={isEdit}
        saving={saving}
        error={error}
        onBack={hidePreview}
        onConfirm={submit}
      />
    )
  }

  return (
    <div className="bg-paper pb-24 md:pb-6">
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 max-w-2xl mx-auto">
        <h2 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
          {isEdit ? 'Modifier la course' : 'Nouvelle course'}
        </h2>
        <p className="text-[12px] text-warm-500 mt-0.5">
          {isEdit ? 'Mettez à jour les informations de la course' : 'Remplissez les informations ci-dessous'}
        </p>
      </div>

      <div className="px-4 md:px-8 py-4 max-w-2xl mx-auto">
          <VoiceMicButton
            isSupported={voice.isSupported}
            isListening={voice.isListening}
            isProcessing={voice.isProcessing}
            transcript={voice.transcript}
            interimTranscript={voice.interimTranscript}
            error={voice.error}
            onStart={voice.start}
            onStop={voice.stop}
          />

          <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-3">Type de course</h3>
          <FieldCard filled={true}>
            <div className="flex gap-2">
              <Chip active={type === 'CPAM'} onClick={() => setType('CPAM')}>Médical</Chip>
              <Chip active={type === 'PRIVE'} onClick={() => { setType('PRIVE'); setMedicalMotif(null) }}>Privé</Chip>
            </div>
          </FieldCard>

          {type === 'CPAM' && (
            <FieldCard label="Motif médical" filled={medicalMotif !== null}>
              <div className="flex gap-2">
                <Chip active={medicalMotif === 'HDJ'} onClick={() => setMedicalMotif('HDJ')}>Hôpital de jour</Chip>
                <Chip active={medicalMotif === 'CONSULTATION'} onClick={() => setMedicalMotif('CONSULTATION')}>Consultation</Chip>
              </div>
            </FieldCard>
          )}

          {type === 'CPAM' && (
            <FieldCard label="Nom du patient" filled={patientName.trim().length > 0}>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ex : Jean Dupont"
                className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[14px] text-ink transition-colors"
              />
            </FieldCard>
          )}

          <AddressField
            label="Départ"
            placeholder="Ex : 12 rue de la République, Marseille"
            value={departure}
            onChange={setDeparture}
            onSelectSuggestion={onSelectDeparture}
            filled={departure.trim().length >= 5}
          />

          <AddressField
            label="Arrivée"
            placeholder="Ex : Hôpital Nord, Marseille"
            value={destination}
            onChange={setDestination}
            onSelectSuggestion={onSelectDestination}
            filled={destination.trim().length >= 5}
          />

          {(loadingRoute || (distanceKm !== null && durationMin !== null)) && (
            <div className="-mt-1 mb-3 flex items-center gap-1.5 text-[13px] text-warm-500">
              <Navigation className="w-3.5 h-3.5" strokeWidth={1.8} />
              {loadingRoute ? (
                <span>Calcul de l&apos;itinéraire…</span>
              ) : (
                <span>{distanceKm} km · {durationMin} min</span>
              )}
            </div>
          )}

          <DateTimeFields date={date} setDate={setDate} time={time} setTime={setTime} />

          <FieldCard label="Prix (€) — facultatif" filled={price.trim().length > 0} compact>
            <input
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Laisser vide ou indiquer un prix"
              min={0}
              max={500}
              className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[18px] font-bold text-ink tabular-nums tracking-tight transition-colors"
            />
            {price.trim().length === 0 && (
              <FareEstimateButton
                type={type}
                medicalMotif={medicalMotif}
                distanceKm={distanceKm}
                date={date}
                time={time}
                departure={departure}
                destination={destination}
                onEstimate={(v) => setPrice(String(v))}
              />
            )}
          </FieldCard>

          <MissionVisibilityField
            visibility={visibility}
            groupId={groupId}
            myGroups={myGroups}
            onSelectPublic={() => { setVisibility('PUBLIC'); setGroupId(null) }}
            onSelectGroup={(id) => { setVisibility('GROUP'); setGroupId(id) }}
          />

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger-soft p-3 text-[13px] text-danger">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={showPreview}
            disabled={!canSubmit}
            className="mt-6 w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prévisualiser
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
      </div>
    </div>
  )
}
