import { getSupabaseClient } from './lib/client'

export interface BlockedDriver {
  blockedId: string
  fullName: string | null
  blockedAt: string
}

export const driverBlockService = {
  /** IDs des chauffeurs bloques par l'user courant (lookup leger pour UI). */
  async getBlockedIds(blockerId: string): Promise<string[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('driver_blocks')
      .select('blocked_id')
      .eq('blocker_id', blockerId)
    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => row.blocked_id)
  },

  /**
   * Liste enrichie pour l'ecran "Collegues bloques" du profil.
   * Deux requetes au lieu d'une jointure : la FK pointe sur auth.users,
   * pas sur drivers, donc Supabase ne peut pas joindre directement vers profiles.
   */
  async getBlockedList(blockerId: string): Promise<BlockedDriver[]> {
    const supabase = getSupabaseClient()
    const { data: blocks, error: blocksError } = await supabase
      .from('driver_blocks')
      .select('blocked_id, created_at')
      .eq('blocker_id', blockerId)
      .order('created_at', { ascending: false })
    if (blocksError) throw new Error(blocksError.message)
    if (!blocks || blocks.length === 0) return []

    const ids = blocks.map((b) => b.blocked_id)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids)
    if (profilesError) throw new Error(profilesError.message)
    const nameById = new Map<string, string | null>(
      (profiles ?? []).map((p) => [p.id, p.full_name])
    )

    return blocks.map((b) => ({
      blockedId: b.blocked_id,
      fullName: nameById.get(b.blocked_id) ?? null,
      blockedAt: b.created_at,
    }))
  },

  /**
   * Bloque un chauffeur. Idempotent : si deja bloque, no-op silencieux.
   * Asymetrie patron↔employe : un trigger DB rejette l'INSERT si l'auteur est
   * chauffeur dans une org ou la cible est patron (owner/admin/dispatcher) —
   * on traduit cette erreur en message utilisateur clair.
   */
  async block(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) throw new Error('Impossible de se bloquer soi-même.')
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('driver_blocks')
      .insert({ blocker_id: blockerId, blocked_id: blockedId })
    if (!error) return
    if (error.message.includes('driver_blocks_unique_pair')) return
    if (error.message.includes('CANNOT_BLOCK_OWN_PATRON')) {
      throw new Error('Vous ne pouvez pas bloquer le patron de votre organisation.')
    }
    throw new Error(error.message)
  },

  /** Debloque un chauffeur. No-op si pas bloque. */
  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('driver_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
    if (error) throw new Error(error.message)
  },
}
