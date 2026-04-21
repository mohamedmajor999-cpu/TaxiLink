// CRUD pour la table de liaison `mission_groups` (partage d'une mission avec plusieurs groupes).
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type DbClient = SupabaseClient<Database>

export const missionGroupsService = {
  /** IDs des groupes ciblés par une mission (lecture côté navigateur). */
  async getGroupIds(missionId: string): Promise<string[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('mission_groups')
      .select('group_id')
      .eq('mission_id', missionId)
    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => r.group_id)
  },
}

/**
 * Remplace les liens `mission_groups` d'une mission par la liste fournie.
 * Appelé côté serveur : delete puis insert dans la même transaction logique.
 */
export async function replaceMissionGroups(
  supabase: DbClient,
  missionId: string,
  groupIds: string[],
): Promise<void> {
  const { error: delError } = await supabase
    .from('mission_groups')
    .delete()
    .eq('mission_id', missionId)
  if (delError) throw new Error(delError.message)

  if (groupIds.length === 0) return
  const rows = groupIds.map((group_id) => ({ mission_id: missionId, group_id }))
  const { error: insError } = await supabase.from('mission_groups').insert(rows)
  if (insError) throw new Error(insError.message)
}
