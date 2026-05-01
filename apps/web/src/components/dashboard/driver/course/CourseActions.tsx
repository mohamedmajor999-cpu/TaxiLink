import { CheckCircle2, MessageSquare, Navigation, Phone, UserCheck, UserMinus, UserX, XCircle } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { WazeIcon, GMapsIcon } from '@/components/ui/GpsAppIcon'
import type { MissionProgressStep } from '@/lib/missionProgress'

interface Props {
  phone: string | null | undefined
  smsHref: string | null
  wazeHref: string | null
  gmapsHref: string | null
  step: MissionProgressStep
  onAdvance: () => void
  onComplete: () => void
  onCancel: () => void
  onNoShow?: () => void
  advancing?: boolean
  completing?: boolean
}

interface PrimaryConfig {
  label: string
  loading: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const PRIMARY: Record<'accepted' | 'enroute' | 'onboard' | 'dropped', PrimaryConfig> = {
  accepted: { label: 'Je pars chercher le patient', loading: 'Mise à jour…', icon: Navigation },
  enroute: { label: 'Patient à bord', loading: 'Mise à jour…', icon: UserCheck },
  onboard: { label: 'Patient déposé', loading: 'Mise à jour…', icon: UserMinus },
  dropped: { label: 'Course terminée', loading: 'Finalisation…', icon: CheckCircle2 },
}

export function CourseActions({
  phone, smsHref, wazeHref, gmapsHref,
  step, onAdvance, onComplete, onCancel, onNoShow,
  advancing, completing,
}: Props) {
  const primaryStep = (['accepted', 'enroute', 'onboard', 'dropped'] as const).includes(step as never)
    ? (step as keyof typeof PRIMARY)
    : 'dropped'
  // Le no-show n'a de sens qu'au pickup : chauffeur arrive (en route) ou
  // patient deja monte qui se desiste avant de partir. Apres dropoff, la
  // course est faite — annulation seulement.
  const showNoShow = onNoShow && (step === 'enroute' || step === 'onboard')
  const cfg = PRIMARY[primaryStep]
  const PrimaryIcon = cfg.icon
  const onPrimary = primaryStep === 'dropped' ? onComplete : onAdvance
  const busy = primaryStep === 'dropped' ? completing : advancing
  const busyLabel = cfg.loading

  return (
    <div className="flex flex-col gap-2">
      {(wazeHref || gmapsHref) && (
        <div className="flex items-stretch gap-2">
          {gmapsHref && <LinkBtn href={gmapsHref} label="Google Maps" icon={GMapsIcon} external />}
          {wazeHref && <LinkBtn href={wazeHref} label="Waze" icon={WazeIcon} external />}
        </div>
      )}
      {(phone || smsHref) && (
        <div className="flex items-stretch gap-2">
          {phone && (
            <LinkBtn
              href={`tel:${phone.replace(/\s/g, '')}`}
              icon={Phone}
              label="Appeler"
              iconClass="text-emerald-500"
            />
          )}
          {smsHref && (
            <LinkBtn
              href={smsHref}
              icon={MessageSquare}
              label="SMS"
              iconClass="text-sky-500"
            />
          )}
        </div>
      )}
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={onPrimary}
          disabled={busy}
          className="flex-[2] flex items-center justify-center gap-2 h-14 rounded-2xl bg-ink text-paper text-[14px] font-bold hover:brightness-110 transition disabled:opacity-60"
        >
          <PrimaryIcon className="w-5 h-5" strokeWidth={2} />
          {busy ? busyLabel : cfg.label}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl border border-danger/40 bg-paper text-danger text-[13px] font-semibold hover:bg-danger-soft transition-colors"
          aria-label="Annuler la course"
        >
          <XCircle className="w-5 h-5" strokeWidth={2} />
          Annuler
        </button>
      </div>
      {showNoShow && (
        <button
          type="button"
          onClick={onNoShow}
          className="inline-flex items-center justify-center gap-2 h-10 rounded-xl text-[12.5px] font-semibold text-warm-600 hover:text-ink hover:bg-warm-50 transition-colors"
        >
          <UserX className="w-4 h-4" strokeWidth={2} />
          Le patient n&apos;est pas là
        </button>
      )}
    </div>
  )
}

interface BtnProps {
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  iconClass?: string
  external?: boolean
}

function LinkBtn({ href, icon: Icon, label, iconClass, external }: BtnProps) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex-1 flex flex-row items-center justify-center gap-2 h-12 rounded-2xl border bg-paper border-warm-200 text-ink text-[14px] font-semibold hover:shadow-md transition-all"
    >
      <Icon className={`w-5 h-5 ${iconClass ?? ''}`} strokeWidth={2} />
      {label}
    </a>
  )
}
