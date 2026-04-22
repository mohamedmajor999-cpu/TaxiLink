import { MessageSquare, Phone, XCircle } from 'lucide-react'

interface Props {
  phone: string | null | undefined
  smsHref: string | null
  onCancel: () => void
}

export function CourseActions({ phone, smsHref, onCancel }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="h-12 rounded-xl bg-paper border border-warm-300 text-ink text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-50 transition-colors"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
            Appeler
          </a>
        )}
        {smsHref && (
          <a
            href={smsHref}
            className="h-12 rounded-xl bg-paper border border-warm-300 text-ink text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" strokeWidth={2} />
            J&apos;arrive
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="w-full h-12 rounded-xl border border-danger/40 bg-paper text-danger text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-danger-soft transition-colors"
      >
        <XCircle className="w-4 h-4" strokeWidth={2} />
        Annuler la course
      </button>
    </>
  )
}
