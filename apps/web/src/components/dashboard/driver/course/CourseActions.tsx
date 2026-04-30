import { CheckCircle2, MessageSquare, Phone, XCircle } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { WazeIcon, GMapsIcon } from '@/components/ui/GpsAppIcon'

interface Props {
  phone: string | null | undefined
  smsHref: string | null
  wazeHref: string | null
  gmapsHref: string | null
  onComplete: () => void
  onCancel: () => void
  completing?: boolean
}

export function CourseActions({ phone, smsHref, wazeHref, gmapsHref, onComplete, onCancel, completing }: Props) {
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
          onClick={onComplete}
          disabled={completing}
          className="flex-[2] flex items-center justify-center gap-2 h-14 rounded-2xl bg-ink text-paper text-[14px] font-bold hover:brightness-110 transition disabled:opacity-60"
        >
          <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
          {completing ? 'Finalisation…' : 'Course terminée'}
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

