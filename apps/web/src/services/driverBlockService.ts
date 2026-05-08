import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface BlockedDriver {
  blockedId: string
  fullName:  string | null
  blockedAt: string
}

export const driverBlockService = {
  /** IDs des chauffeurs bloqués par l'user courant (lookup léger pour UI). */
  async getBlockedIds(blockerId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('driver_blocks')
      .select('blocked_id')
      .eq('blocker_id', blockerId)
    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => row.blocked_id)
  },

  /**
   * Liste enrichie pour l'écran "Collègues bloqués" du profil.
   * Deux requêtes au lieu d'une jointure : la FK pointe sur auth.users,
   * pas sur drivers, donc Supabase ne peut pas joindre directement vers profiles.
   */
  async getBlockedList(blockerId: string): Promise<BlockedDriver[]> {
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
      fullName:  nameById.get(b.blocked_id) ?? null,
      blockedAt: b.created_at,
    }))
  },

  /**
   * Bloque un chauffeur. Idempotent : si déjà bloqué, no-op silencieux.
   * Asymétrie patron↔employé : un trigger DB rejette l'INSERT si l'auteur est
   * chauffeur dans une org où la cible est patron (owner/admin/dispatcher) —
   * on traduit cette erreur en message utilisateur clair.
   */
  async block(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) throw new Error('Impossible de se bloquer soi-même.')
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

  /** Débloque un chauffeur. No-op si pas bloqué. */
  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await supabase
      .from('driver_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
    if (error) throw new Error(error.message)
  },
}
