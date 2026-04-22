import { Accessibility, ArrowLeftRight, Bed, User } from 'lucide-react'
import { RideBadge } from '@/components/taxilink/RideBadge'

interface Props {
  type: string
  medicalMotif?: string | null
  transportType?: string | null
  returnTrip: boolean
}

const MOTIF_LABEL: Record<string, string> = {
  HDJ: 'Hôpital de jour',
  CONSULTATION: 'Consultation',
}

const TRANSPORT_LABEL: Record<string, { text: string; icon: typeof User }> = {
  SEATED: { text: 'Assis', icon: User },
  WHEELCHAIR: { text: 'Fauteuil roulant', icon: Accessibility },
  STRETCHER: { text: 'Brancard', icon: Bed },
}

export function CourseInfoBlock({ type, medicalMotif, transportType, returnTrip }: Props) {
  const transport = transportType ? TRANSPORT_LABEL[transportType] : null
  const TransportIcon = transport?.icon
  const motifLabel = medicalMotif ? MOTIF_LABEL[medicalMotif] : null

  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-4 mb-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-3">Course</p>
      <div className="flex flex-wrap gap-2 items-center">
        <RideBadge variant={type === 'CPAM' ? 'medical' : 'private'}>
          {type === 'CPAM' ? 'CPAM' : 'Privé'}
        </RideBadge>
        {motifLabel && <RideBadge variant="fleet">{motifLabel}</RideBadge>}
        {transport && TransportIcon && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-warm-50 text-ink border border-warm-200">
            <TransportIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {transport.text}
          </span>
        )}
        {returnTrip && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-warm-50 text-ink border border-warm-200">
            <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={2} />
            Aller-retour
          </span>
        )}
      </div>
    </div>
  )
}
