'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { getMissionProgress, PROGRESS_LABELS } from '@/lib/missionProgress'

interface Props {
  mission: Mission
}

export function CurrentCourseStrip({ mission }: Props) {
  const step = getMissionProgress(mission)
  const stepLabel = PROGRESS_LABELS[step]

  return (
    <Link
      href="/dashboard/chauffeur/course-en-cours"
      className="group relative block overflow-hidden rounded-2xl bg-ink text-paper p-4 mb-3 hover:brightness-110 transition"
      aria-label={`Course en cours — étape ${stepLabel}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full bg-emerald-400 motion-safe:animate-pulse"
        />
        <span className="text-[11px] font-extrabold tracking-[0.08em] text-emerald-300 uppercase">
          Course en cours
        </span>
        <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.06em] text-paper/70">
          {stepLabel}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight truncate">
            {mission.patient_name || 'Patient'}
          </p>
          <p className="text-[12.5px] text-paper/70 truncate">
            → {mission.destination}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-paper/10 text-paper group-hover:bg-paper/15">
          <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
        </span>
      </div>
    </Link>
  )
}
