import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

interface Props {
  mission: Mission
  /** Distance et durée fraîchement calculées via Google Routes / OSRM, utilisées
   * pour fiabiliser l'estimation quand la BDD n'a pas encore les valeurs. */
  fallbackDistanceKm?: number | null
  fallbackDurationMin?: number | null
}

export function CoursePriceBlock({ mission, fallbackDistanceKm, fallbackDurationMin }: Props) {
  const fare = computeDisplayFare({
    price_eur: mission.price_eur,
    type: mission.type,
    medical_motif: mission.medical_motif,
    distance_km: mission.distance_km ?? fallbackDistanceKm ?? null,
    duration_min: mission.duration_min ?? fallbackDurationMin ?? null,
    scheduled_at: mission.scheduled_at,
    departure: mission.departure,
    destination: mission.destination,
  })

  if (fare.value <= 0) return null

  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-4 mb-4 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-1">
          {fare.isEstimated ? 'Prix estimé' : 'Prix convenu'}
        </p>
        <p className="text-[10px] text-warm-500">
          {mission.type === 'CPAM' ? 'Tarif préfectoral CPAM' : 'Estimation barème Marseille'}
        </p>
      </div>
      <p className="text-[28px] font-bold text-ink tabular-nums tracking-tight leading-none">
        {fare.value.toFixed(0)}<span className="text-[18px] ml-0.5">€</span>
      </p>
    </div>
  )
}
