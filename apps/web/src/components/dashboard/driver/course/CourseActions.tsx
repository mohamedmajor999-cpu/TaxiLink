import { CheckCircle2, MessageSquare, Phone, XCircle } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

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

function WazeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3c-4.97 0-9 3.58-9 8 0 1.76.64 3.39 1.72 4.72-.16.56-.47 1.3-.97 1.8-.2.2-.13.54.15.62 1.46.42 3.13-.11 4.05-.56A9.73 9.73 0 0012 19c4.97 0 9-3.58 9-8s-4.03-8-9-8z" stroke="#33CCFF" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="9" cy="10" r="1" fill="#33CCFF" />
      <circle cx="15" cy="10" r="1" fill="#33CCFF" />
    </svg>
  )
}

function GMapsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" fill="#EA4335" />
      <circle cx="12" cy="10" r="3" fill="#FFFFFF" />
    </svg>
  )
}
