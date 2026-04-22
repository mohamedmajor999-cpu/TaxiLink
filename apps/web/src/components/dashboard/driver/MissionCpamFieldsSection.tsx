'use client'
import { FieldCard, Chip } from './MissionFormPrimitives'
import { TransportTypeField } from './TransportTypeField'
import { ReturnTripField } from './ReturnTripField'
import type { MedicalMotif, TransportType } from '@/lib/validators'

interface Props {
  medicalMotif: MedicalMotif | null
  setMedicalMotif: (m: MedicalMotif | null) => void
  patientName: string
  setPatientName: (s: string) => void
  transportType: TransportType | null
  setTransportType: (t: TransportType) => void
  returnTrip: boolean
  setReturnTrip: (v: boolean) => void
  returnTime: string | null
  setReturnTime: (v: string | null) => void
}

export function MissionCpamFieldsSection(p: Props) {
  return (
    <>
      <FieldCard label="Motif médical" filled={p.medicalMotif !== null}>
        <div className="flex gap-2">
          <Chip active={p.medicalMotif === 'HDJ'} onClick={() => p.setMedicalMotif('HDJ')}>Hôpital de jour</Chip>
          <Chip active={p.medicalMotif === 'CONSULTATION'} onClick={() => p.setMedicalMotif('CONSULTATION')}>Consultation</Chip>
        </div>
      </FieldCard>

      <FieldCard label="Nom du patient" filled={p.patientName.trim().length > 0}>
        <input
          value={p.patientName}
          onChange={(e) => p.setPatientName(e.target.value)}
          placeholder="Ex : Jean Dupont"
          className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[14px] text-ink transition-colors"
        />
      </FieldCard>

      <TransportTypeField value={p.transportType} onChange={p.setTransportType} />

      <ReturnTripField
        returnTrip={p.returnTrip}
        returnTime={p.returnTime}
        onToggle={p.setReturnTrip}
        onTimeChange={p.setReturnTime}
      />
    </>
  )
}
