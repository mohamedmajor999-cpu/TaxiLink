import { createAdminSupabaseClient } from './supabase/admin'

export interface PublicMission {
  id: string
  type: 'CPAM' | 'PRIVE' | string
  departure: string
  destination: string
  scheduled_at: string
  price_eur: number | null
  price_min_eur: number | null
  price_max_eur: number | null
  distance_km: number | null
  duration_min: number | null
  status: string
  return_trip: boolean
}

/**
 * Lit une mission par id côté serveur via service_role (bypass RLS).
 * Renvoie UNIQUEMENT les champs non-sensibles destinés à l'aperçu public
 * (jamais le numéro de téléphone, le nom du patient, les notes).
 *
 * Utilisé par la page publique `/c/[id]` et par la génération de l'image
 * Open Graph qui sert de prévisualisation WhatsApp/SMS/réseaux.
 */
export async function fetchPublicMission(id: string): Promise<PublicMission | null> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .select('id, type, departure, destination, scheduled_at, price_eur, price_min_eur, price_max_eur, distance_km, duration_min, status, return_trip')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return data as PublicMission
}
