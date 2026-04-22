import { FileText, Phone, User, UserPlus, Users } from 'lucide-react'

interface Props {
  type: string
  patientName?: string | null
  passengers?: number | null
  companion: boolean
  phone?: string | null
  notes?: string | null
}

export function CoursePassengerBlock({ type, patientName, passengers, companion, phone, notes }: Props) {
  const isMedical = type === 'CPAM'
  const nameLine = isMedical
    ? patientName || 'Patient non renseigné'
    : passengers != null ? `${passengers} passager${passengers > 1 ? 's' : ''}` : 'Passagers non renseignés'

  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-4 mb-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-3">
        {isMedical ? 'Patient' : 'Passagers'}
      </p>
      <div className="space-y-2.5 text-[14px] text-ink">
        <Row icon={isMedical ? User : Users} text={nameLine} />
        {companion && <Row icon={UserPlus} text="Avec accompagnant" />}
        {phone && <Row icon={Phone} text={phone} mono />}
        {notes && <Row icon={FileText} text={notes} multiline />}
      </div>
    </div>
  )
}

interface RowProps {
  icon: typeof User
  text: string
  mono?: boolean
  multiline?: boolean
}

function Row({ icon: Icon, text, mono, multiline }: RowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-warm-500 mt-0.5 shrink-0" strokeWidth={2} />
      <span className={`${mono ? 'tabular-nums' : ''} ${multiline ? 'whitespace-pre-wrap' : ''}`}>{text}</span>
    </div>
  )
}
