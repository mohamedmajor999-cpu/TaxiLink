'use client'
import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { usePostedAcceptStore } from '@/store/postedAcceptStore'

interface Props {
  onViewPosted?: () => void
}

const AUTO_DISMISS_MS = 6000

export function PostedMissionAcceptPopup({ onViewPosted }: Props) {
  const popup = usePostedAcceptStore((s) => s.popup)
  const dismiss = usePostedAcceptStore((s) => s.dismissPopup)

  useEffect(() => {
    if (!popup) return
    const t = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [popup, dismiss])

  if (!popup) return null

  const handleView = () => {
    dismiss()
    onViewPosted?.()
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[9998] left-4 right-4 bottom-[84px] md:left-auto md:right-6 md:bottom-6 md:w-[340px] animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="flex items-center gap-3 bg-ink text-paper rounded-2xl shadow-xl pl-3 pr-2 py-2.5">
        <div className="w-8 h-8 shrink-0 rounded-full bg-brand flex items-center justify-center">
          <Check className="w-4 h-4 text-ink" strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[13px] font-semibold truncate">
            {popup.driverName} a accepté
          </div>
          <div className="text-[11px] text-paper/60 truncate">
            {popup.departure} → {popup.destination}
          </div>
        </div>
        <button
          type="button"
          onClick={handleView}
          className="shrink-0 h-8 px-3 rounded-full bg-brand text-ink text-[12px] font-bold hover:brightness-95 transition"
        >
          Voir
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="shrink-0 w-7 h-7 rounded-full text-paper/60 hover:text-paper hover:bg-paper/10 flex items-center justify-center transition"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
