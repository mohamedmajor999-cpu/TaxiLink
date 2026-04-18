'use client'
import { ArrowRight } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'

interface Props {
  mission: Mission
  onShowDetail: () => void
}

export function CurrentMissionCard({ mission, onShowDetail }: Props) {
  return (
    <section
      aria-label="Course en cours"
      className="mb-5 rounded-2xl border-2 border-ink bg-ink text-paper p-4 md:p-5 flex items-center gap-4"
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-paper/70">
          Course en cours
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-paper/70 truncate">{mission.departure}</p>
        <p className="text-[14px] font-semibold truncate">→ {mission.destination}</p>
      </div>
      <button
        type="button"
        onClick={onShowDetail}
        className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-ink text-[13px] font-bold hover:brightness-95 transition-all"
      >
        Détail
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </section>
  )
}
