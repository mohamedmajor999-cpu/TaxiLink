import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

// Valeur tarifaire affichee pour une mission donnee. Centralise le pont vers
// computeDisplayFare pour que useStatsTab et les agregations restent
// alignees avec le reste de l'app (fourchette / forfait / km × tarif).
export function fareValue(m: Mission): number {
  return computeDisplayFare(m).value
}
