'use client'

import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { usePostedUntakenStore } from '@/store/postedUntakenStore'
import { useMissionEditStore } from '@/store/missionEditStore'

const AUTO_DISMISS_MS = 8000

function formatAgeMin(createdAtIso: string): string {
  const min = Math.floor((Date.now() - new Date(createdAtIso).getTime()) / 60_000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  return h === 1 ? 'il y a 1 h' : `il y a ${h} h`
}

/**
 * Toast qui s'affiche quand une course postée par l'user n'a pas trouvé
 * preneur après ~2 min. CTA : Modifier (ouvre MissionEditSheet via le store)
 * pour que l'user puisse changer les groupes ciblés et republier.
 */
export function PostedMissionUntakenPopup() {
  const popup     = usePostedUntakenStore((s) => s.popup)
  const dismiss   = usePostedUntakenStore((s) => s.dismissPopup)
  const markSeen  = usePostedUntakenStore((s) => s.markSeen)
  const startEdit = useMissionEditStore((s) => s.startEdit)

  useEffect(() => {
    if (!popup) return
    const t = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [popup, dismiss])

  if (!popup) return null

  const handleEdit = () => {
    startEdit(popup)
    markSeen(popup.id)
    dismiss()
  }

  const handleClose = () => {
    markSeen(popup.id)
    dismiss()
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[9998] left-4 right-4 bottom-[84px] md:left-auto md:right-6 md:bottom-6 md:w-[360px] animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="flex items-center gap-3 bg-ink text-paper rounded-2xl shadow-xl pl-3 pr-2 py-2.5">
        <div className="w-8 h-8 shrink-0 rounded-full bg-amber-400 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-ink" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[13px] font-semibold truncate">
            Personne n&apos;a pris ta course
          </div>
          <div className="text-[11px] text-paper/60 truncate">
            {popup.departure} → {popup.destination} · {formatAgeMin(popup.created_at)}
          </div>
        </div>
        <button
          type="button"
          onClick={handleEdit}
          className="shrink-0 h-8 px-3 rounded-full bg-amber-400 text-ink text-[12px] font-bold hover:brightness-95 transition"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Ignorer"
          className="shrink-0 w-7 h-7 rounded-full text-paper/60 hover:text-paper hover:bg-paper/10 flex items-center justify-center transition"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
