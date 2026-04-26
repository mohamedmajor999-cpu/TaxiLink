'use client'
import { Megaphone, Loader2 } from 'lucide-react'

interface Props {
  hoursWaiting: number
  busy?: boolean
  onBoostPrice: () => void
  onExpandGroups: () => void
}

export function PostedBoostStrip({ hoursWaiting, busy, onBoostPrice, onExpandGroups }: Props) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 rounded-lg bg-[#FFFAEB] border border-[#FCD34D] px-2.5 py-2 text-[11px] font-semibold text-[#92400E]">
        <Megaphone className="w-4 h-4 shrink-0" strokeWidth={2.2} />
        <span className="flex-1 leading-tight">
          Toujours sans preneur depuis {hoursWaiting}h. Boostez votre course.
        </span>
      </div>
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={onExpandGroups}
          disabled={busy}
          className="flex-1 h-8 rounded-lg bg-brand text-ink text-[11px] font-extrabold disabled:opacity-50 hover:bg-brand/90 transition-colors"
        >
          Élargir aux groupes
        </button>
        <button
          type="button"
          onClick={onBoostPrice}
          disabled={busy}
          className="flex-1 h-8 rounded-lg bg-ink text-paper text-[11px] font-extrabold disabled:opacity-50 hover:bg-warm-800 transition-colors inline-flex items-center justify-center gap-1"
        >
          {busy && <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.4} />}
          +5 € sur le prix
        </button>
      </div>
    </div>
  )
}
