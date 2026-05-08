import { createClient } from '@/lib/supabase/client'
import type { Mission } from '@/lib/supabase/types'

const STALENESS_MIN = 2

const supabase = createClient()

/**
 * Détection des missions postées par l'user qui n'ont pas trouvé preneur.
 * Critère : AVAILABLE + créées il y a > 2 min + AUCUNE offre PENDING en cours.
 * Ce signal alimente le notifier "course pas prise" côté driver dashboard,
 * pour pousser le poster à republier dans d'autres groupes ou annuler.
 */
export const untakenMissionService = {
  async getStuck(userId: string): Promise<Mission[]> {
    const cutoffIso = new Date(Date.now() - STALENESS_MIN * 60_000).toISOString()
    const nowIso    = new Date().toISOString()

    const { data: candidates, error: e1 } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('shared_by', userId)
      .in('status', ['AVAILABLE', 'STALE'])
      .lt('created_at', cutoffIso)
    if (e1) throw new Error(e1.message)
    if (!candidates || candidates.length === 0) return []

    const ids = candidates.map((m) => m.id)
    const { data: pending, error: e2 } = await supabase
      .from('mission_offers')
      .select('mission_id')
      .in('mission_id', ids)
      .eq('status', 'PENDING')
      .gt('expires_at', nowIso)
    if (e2) throw new Error(e2.message)

    const stillCascading = new Set((pending ?? []).map((o) => o.mission_id))
    return (candidates as Mission[]).filter((m) => !stillCascading.has(m.id))
  },
}
