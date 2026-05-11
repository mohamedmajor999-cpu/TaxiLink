import { getSupabaseClient } from './lib/client'

export type OfferStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'LOST_TO_FASTER_CLICK'
  | 'REFUSED'
  | 'EXPIRED'

export interface PendingOffer {
  id: string
  mission_id: string
  status: OfferStatus
  expires_at: string
  sent_at: string
  radius_km_at_offer: number
  distance_km_at_offer: number | null
}

export interface AcceptResult {
  success: boolean
  mission_id?: string
  error?: string
}
export interface RefuseResult {
  success: boolean
  error?: string
}

export const missionOfferService = {
  /**
   * Offres PENDING actuellement visibles pour le chauffeur courant.
   * Filtre :
   *   - status = PENDING
   *   - expires_at  > now (pas expiree)
   *   - unlock_at  <= now (Phase 3 : la fenetre exclusive du bonifie est passee)
   */
  async getPendingForDriver(driverId: string): Promise<PendingOffer[]> {
    const supabase = getSupabaseClient()
    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from('mission_offers')
      .select(
        'id, mission_id, status, expires_at, sent_at, radius_km_at_offer, distance_km_at_offer'
      )
      .eq('driver_id', driverId)
      .eq('status', 'PENDING')
      .gt('expires_at', nowIso)
      .lte('unlock_at', nowIso)
      .order('sent_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as PendingOffer[]
  },

  /** Accepte une offre. RPC atomique : flip mission AVAILABLE→IN_PROGRESS + autres offres LOST_TO_FASTER_CLICK. */
  async accept(offerId: string): Promise<AcceptResult> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('accept_mission_offer', {
      p_offer_id: offerId,
    })
    if (error) throw new Error(error.message)
    // Le RPC retourne JSONB qui peut etre tout type Json. La forme {success, mission_id?, error?}
    // est garantie par la fonction SQL elle-meme (cf. 20260507_mission_offers.sql).
    return (data ?? { success: false }) as unknown as AcceptResult
  },

  /** Refuse une offre. La cascade peut alors basculer immediatement au palier suivant. */
  async refuse(offerId: string): Promise<RefuseResult> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('refuse_mission_offer', {
      p_offer_id: offerId,
    })
    if (error) throw new Error(error.message)
    return (data ?? { success: false }) as unknown as RefuseResult
  },
}
