'use client'
import { Navigation } from 'lucide-react'

interface Props {
  distanceKm: number | null
  durationMin: number | null
  loading: boolean
}

export function RouteInfoDisplay({ distanceKm, durationMin, loading }: Props) {
  const hasResult = distanceKm !== null && durationMin !== null
  if (!loading && !hasResult) return null
  return (
    <div className="-mt-1 mb-3 flex items-center gap-1.5 text-[13px] text-warm-500">
      <Navigation className="w-3.5 h-3.5" strokeWidth={1.8} />
      {loading ? (
        <span>Calcul de l&apos;itinéraire…</span>
      ) : (
        <span>{distanceKm} km · {durationMin} min</span>
      )}
    </div>
  )
}
