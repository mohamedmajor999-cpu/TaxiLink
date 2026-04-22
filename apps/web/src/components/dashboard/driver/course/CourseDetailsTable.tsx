'use client'
import type { Mission } from '@/lib/supabase/types'

interface Props {
  mission: Mission
}

const TRANSPORT_LABEL: Record<string, string> = {
  SEATED: 'Assis',
  WHEELCHAIR: 'Fauteuil roulant',
  STRETCHER: 'Brancard',
}
const MOTIF_LABEL: Record<string, string> = {
  HDJ: 'HDJ',
  CONSULTATION: 'Consultation',
}

export function CourseDetailsTable({ mission }: Props) {
  const typeExtras: string[] = []
  if (mission.medical_motif && MOTIF_LABEL[mission.medical_motif]) typeExtras.push(MOTIF_LABEL[mission.medical_motif])
  if (mission.transport_type && TRANSPORT_LABEL[mission.transport_type]) typeExtras.push(TRANSPORT_LABEL[mission.transport_type])
  if (mission.return_trip) typeExtras.push('Aller-retour')
  const typeValue = typeExtras.length > 0
    ? [mission.type === 'CPAM' ? 'CPAM' : 'Privé', ...typeExtras].join(' · ')
    : null

  const isMedical = mission.type === 'CPAM'
  const nameLabel = isMedical ? 'Patient' : 'Passager'
  const name = isMedical ? mission.patient_name || null : null

  const countLabel = isMedical ? null : 'Passagers'
  const countValue = mission.passengers != null
    ? `${mission.passengers} personne${mission.passengers > 1 ? 's' : ''}`
    : null

  const hasAnyRow =
    !!typeValue ||
    (mission.return_trip && mission.return_time) ||
    !!name ||
    (countLabel && countValue) ||
    !!mission.companion ||
    !!mission.notes

  if (!hasAnyRow) return null

  return (
    <div className="rounded-2xl border border-warm-200 bg-paper overflow-hidden mb-3">
      {typeValue && <Row label="Type" value={typeValue} />}
      {mission.return_trip && mission.return_time && <Row label="Retour" value={mission.return_time} mono />}
      {name && <Row label={nameLabel} value={name} />}
      {countLabel && countValue && <Row label={countLabel} value={countValue} />}
      {mission.companion && <Row label="Accompagnant" value="Oui" />}
      {mission.notes && <Row label="Notes" value={mission.notes} multiline />}
    </div>
  )
}

interface RowProps {
  label: string
  value: string
  mono?: boolean
  multiline?: boolean
}

function Row({ label, value, mono, multiline }: RowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 border-b border-warm-200 last:border-b-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-warm-500 w-24 shrink-0 pt-0.5">{label}</span>
      <span
        className={`flex-1 min-w-0 text-ink text-[14px] ${mono ? 'tabular-nums' : ''} ${multiline ? 'whitespace-pre-wrap' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
