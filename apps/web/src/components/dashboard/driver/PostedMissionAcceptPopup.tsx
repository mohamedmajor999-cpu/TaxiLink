'use client'
import { CheckCircle2, Phone, User, X } from 'lucide-react'
import { usePostedAcceptStore } from '@/store/postedAcceptStore'

interface Props {
  onViewPosted?: () => void
}

export function PostedMissionAcceptPopup({ onViewPosted }: Props) {
  const popup = usePostedAcceptStore((s) => s.popup)
  const dismiss = usePostedAcceptStore((s) => s.dismissPopup)

  if (!popup) return null

  const handleView = () => {
    dismiss()
    onViewPosted?.()
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="posted-accept-popup-title"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-paper rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="relative bg-brand px-5 py-6 text-center">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fermer"
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-ink/10 hover:bg-ink/20 flex items-center justify-center text-ink transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
          <div className="w-14 h-14 mx-auto rounded-full bg-ink flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-brand" strokeWidth={2} />
          </div>
          <h2 id="posted-accept-popup-title" className="text-[18px] font-bold text-ink leading-tight">
            Votre annonce a été acceptée !
          </h2>
        </div>

        <div className="px-5 py-5 space-y-4">
          <p className="text-[14px] text-ink leading-snug">
            <span className="font-semibold">{popup.driverName}</span>{' '}
            a accepté votre annonce de{' '}
            <span className="font-semibold">{popup.departure}</span>{' '}
            à <span className="font-semibold">{popup.destination}</span>.
          </p>

          <div className="rounded-xl border border-warm-200 bg-warm-50 px-3 py-3 space-y-2">
            <div className="flex items-center gap-2 text-[13px] text-ink">
              <User className="w-4 h-4 text-warm-500" strokeWidth={2} />
              <span className="font-semibold truncate">{popup.driverName}</span>
            </div>
            {popup.driverPhone ? (
              <a
                href={`tel:${popup.driverPhone}`}
                className="flex items-center gap-2 text-[13px] font-semibold text-ink hover:underline"
              >
                <Phone className="w-4 h-4 text-warm-500" strokeWidth={2} />
                {popup.driverPhone}
              </a>
            ) : (
              <div className="flex items-center gap-2 text-[12px] text-warm-500 italic">
                <Phone className="w-4 h-4" strokeWidth={2} />
                Téléphone non renseigné
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 h-10 rounded-lg border border-warm-200 text-[13px] font-semibold text-ink hover:bg-warm-50 transition-colors"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleView}
              className="flex-1 h-10 rounded-lg bg-ink text-paper text-[13px] font-semibold hover:bg-warm-800 transition-colors"
            >
              Voir l&apos;annonce
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
