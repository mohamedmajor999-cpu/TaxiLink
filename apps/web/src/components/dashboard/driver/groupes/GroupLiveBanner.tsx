'use client'
import { ArrowRight } from 'lucide-react'

interface Props {
  available: number
  onOpen:    () => void
}

// Bandeau "courses à prendre maintenant" — visible uniquement si available > 0.
// C'est le signal d'urgence du détail de groupe : sans courses dispo, pas de
// CTA — on évite le faux positif visuel.
export function GroupLiveBanner({ available, onOpen }: Props) {
  if (available <= 0) return null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative w-full mb-3 rounded-2xl bg-ink text-paper p-4 flex items-center gap-3 overflow-hidden text-left active:scale-[0.99] transition-transform"
    >
      <span aria-hidden className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-brand/10" />
      <span className="relative w-11 h-11 rounded-2xl bg-brand text-ink flex items-center justify-center font-bold text-[20px] shrink-0">
        {available}
        <span aria-hidden className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand border-2 border-ink motion-safe:animate-pulse" />
      </span>
      <span className="relative flex-1 min-w-0">
        <span className="block text-[14px] font-bold leading-tight">
          {available} course{available > 1 ? 's' : ''} à prendre maintenant
        </span>
        <span className="block text-[11.5px] text-paper/60 mt-0.5">
          Postée{available > 1 ? 's' : ''} par tes confrères du groupe
        </span>
      </span>
      <span className="relative w-8 h-8 rounded-full bg-brand text-ink flex items-center justify-center shrink-0">
        <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
      </span>
    </button>
  )
}
