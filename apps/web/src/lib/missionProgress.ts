import type { Mission } from '@/lib/supabase/types'

// Sous-etapes d'une course IN_PROGRESS, derivees des horodatages.
// Pas de champ status dedie : on lit pickup_at / dropoff_at / etc. pour
// reconstituer l'etape, ce qui evite de toucher au cycle de vie principal
// (AVAILABLE → IN_PROGRESS → DONE) et reste compatible avec les RLS.
export type MissionProgressStep =
  | 'available'
  | 'accepted'   // chauffeur a pris la course, n'est pas encore parti
  | 'enroute'    // chauffeur en route vers le pickup
  | 'onboard'    // patient a bord
  | 'dropped'    // patient depose, course pas encore cloturee
  | 'done'       // cloturee
  | 'no_show'    // patient absent
  | 'cancelled'

export function getMissionProgress(m: Mission): MissionProgressStep {
  if (m.status === 'AVAILABLE') return 'available'
  if (m.no_show) return 'no_show'
  if (m.status === 'DONE') return 'done'

  if (m.dropoff_at) return 'dropped'
  if (m.pickup_at) return 'onboard'
  if (m.enroute_at) return 'enroute'
  return 'accepted'
}

export const PROGRESS_LABELS: Record<MissionProgressStep, string> = {
  available: 'Disponible',
  accepted: 'Acceptée',
  enroute: 'En route',
  onboard: 'Patient à bord',
  dropped: 'Patient déposé',
  done: 'Terminée',
  no_show: 'Patient absent',
  cancelled: 'Annulée',
}
