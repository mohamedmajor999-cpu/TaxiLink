'use client'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { MissionVisibilityField } from './MissionVisibilityField'
import { AddressField } from './AddressField'
import { FieldCard, Chip } from './MissionFormPrimitives'
import { VoiceMicButton } from './VoiceMicButton'
import { MissionCpamFieldsSection } from './MissionCpamFieldsSection'
import { PassengersField } from './PassengersField'
import { CompanionToggle } from './CompanionToggle'
import { DateTimeFields } from './DateTimeFields'
import { PriceFields } from './PriceFields'
import { RouteInfoDisplay } from './RouteInfoDisplay'
import type { usePartagerMissionModal } from './usePartagerMissionModal'
import type { useMissionVoiceFiller } from './useMissionVoiceFiller'

type FormCtx = ReturnType<typeof usePartagerMissionModal>
type VoiceCtx = ReturnType<typeof useMissionVoiceFiller>

interface Props {
  f: FormCtx
  voice: VoiceCtx
}

const QUESTION_TO_ANCHOR: Record<string, string> = {
  type: 'field-type',
  medicalMotif: 'field-cpam',
  patientName: 'field-cpam',
  transportType: 'field-cpam',
  returnTrip: 'field-cpam',
  returnTime: 'field-cpam',
  departure: 'field-departure',
  destination: 'field-destination',
  phone: 'field-phone',
  date: 'field-datetime',
  time: 'field-datetime',
  passengers: 'field-passengers',
  companion: 'field-companion',
  price: 'field-price',
  visibility: 'field-visibility',
  groupIds: 'field-visibility',
}

/** Mappe l'id d'une GuidedQuestion vers l'ancre DOM de la section correspondante dans le formulaire Libre. */
export function getLibreFieldAnchor(questionId: string): string | null {
  return QUESTION_TO_ANCHOR[questionId] ?? null
}

export function MissionFormLibre({ f, voice }: Props) {
  return (
    <>
      <VoiceMicButton
        isSupported={voice.isSupported} isListening={voice.isListening}
        isProcessing={voice.isProcessing} transcript={voice.transcript}
        interimTranscript={voice.interimTranscript} error={voice.error}
        onStart={voice.start} onStop={voice.stop}
      />

      <div id="field-type" className="scroll-mt-24">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-3">Type de course</h3>
        <FieldCard filled={true}>
          <div className="flex gap-2">
            <Chip active={f.type === 'CPAM'} onClick={() => f.setType('CPAM')}>Médical</Chip>
            <Chip active={f.type === 'PRIVE'} onClick={() => { f.setType('PRIVE'); f.setMedicalMotif(null) }}>Privé</Chip>
          </div>
        </FieldCard>
      </div>

      {f.type === 'CPAM' && (
        <div id="field-cpam" className="scroll-mt-24">
          <MissionCpamFieldsSection
            medicalMotif={f.medicalMotif} setMedicalMotif={f.setMedicalMotif}
            patientName={f.patientName} setPatientName={f.setPatientName}
            transportType={f.transportType} setTransportType={f.setTransportType}
            returnTrip={f.returnTrip} setReturnTrip={f.setReturnTrip}
            returnTime={f.returnTime} setReturnTime={f.setReturnTime}
          />
        </div>
      )}

      <div id="field-departure" className="scroll-mt-24">
        <AddressField
          label="Départ" placeholder="Ex : 12 rue de la République, Marseille"
          value={f.departure} onChange={f.setDeparture}
          onSelectSuggestion={f.onSelectDeparture}
          filled={f.departure.trim().length >= 5}
        />
      </div>

      <div id="field-destination" className="scroll-mt-24">
        <AddressField
          label="Arrivée" placeholder="Ex : Hôpital Nord, Marseille"
          value={f.destination} onChange={f.setDestination}
          onSelectSuggestion={f.onSelectDestination}
          filled={f.destination.trim().length >= 5}
        />
      </div>

      <div id="field-phone" className="scroll-mt-24">
        <FieldCard label="Téléphone du client — facultatif" filled={f.phone.trim().length > 0} compact>
          <input
            type="tel" inputMode="tel" autoComplete="tel"
            value={f.phone} onChange={(e) => f.setPhone(e.target.value)}
            placeholder="Ex : 06 12 34 56 78"
            className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[14px] text-ink tabular-nums transition-colors"
          />
          <p className="mt-1.5 text-[11px] text-warm-500">
            Utilisé pour l&apos;appel direct et le SMS &laquo;&nbsp;J&apos;arrive&nbsp;&raquo; pendant la course.
          </p>
        </FieldCard>
      </div>

      <RouteInfoDisplay distanceKm={f.distanceKm} durationMin={f.durationMin} loading={f.loadingRoute} />

      <div id="field-datetime" className="scroll-mt-24">
        <DateTimeFields date={f.date} setDate={f.setDate} time={f.time} setTime={f.setTime} />
      </div>

      {f.type === 'PRIVE' && (
        <div id="field-passengers" className="scroll-mt-24">
          <PassengersField value={f.passengers} onChange={f.setPassengers} />
        </div>
      )}
      <div id="field-companion" className="scroll-mt-24">
        <CompanionToggle value={f.companion} onChange={f.setCompanion} />
      </div>

      <div id="field-price" className="scroll-mt-24">
        <PriceFields
          type={f.type} medicalMotif={f.medicalMotif}
          price={f.price} setPrice={f.setPrice}
          priceMin={f.priceMin} setPriceMin={f.setPriceMin}
          priceMax={f.priceMax} setPriceMax={f.setPriceMax}
          distanceKm={f.distanceKm} durationMin={f.durationMin}
          date={f.date} time={f.time}
          departure={f.departure} destination={f.destination}
        />
      </div>

      <div id="field-visibility" className="scroll-mt-24">
        <MissionVisibilityField
          visibility={f.visibility} groupIds={f.groupIds} myGroups={f.myGroups}
          onSelectPublic={f.onSelectPublic} onToggleGroup={f.onToggleGroup}
        />
      </div>

      {f.error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger-soft p-3 text-[13px] text-danger">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
          <span>{f.error}</span>
        </div>
      )}

      <button
        type="button" onClick={f.showPreview} disabled={!f.canSubmit}
        className="mt-6 w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Prévisualiser
        <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </button>
    </>
  )
}
