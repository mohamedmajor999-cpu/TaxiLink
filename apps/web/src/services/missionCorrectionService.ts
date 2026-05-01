import { api } from '@/lib/api'
import type { Mission } from '@/lib/supabase/types'

export interface CorrectionPatch {
  departure?: string
  departure_lat?: number | null
  departure_lng?: number | null
  destination?: string
  destination_lat?: number | null
  destination_lng?: number | null
  distance_km?: number | null
  duration_min?: number | null
  price_eur?: number | null
  phone?: string | null
}

/**
 * Corrections post-acceptation par le chauffeur :
 * - Adresses + coords + distance/duree + phone : status IN_PROGRESS / ACCEPTED
 * - price_eur (montant reel) : status DONE
 * Ownership : driver_id = auth.uid() verifie cote serveur.
 */
export const missionCorrectionService = {
  async correct(id: string, patch: CorrectionPatch): Promise<Mission> {
    const { mission } = await api.patch<{ mission: Mission }>(`/api/missions/${id}/correction`, patch)
    return mission
  },
}
