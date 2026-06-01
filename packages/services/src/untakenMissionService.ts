import { getSupabaseClient } from './lib/client'
import type { Mission } from '@taxilink/supabase-types'

const STALENESS_MIN = 2
// Borne superieure : on ne notifie pas pour des annonces vieilles de plus de
// 48h. Sinon des annonces oubliees en base (jamais annulees) genereraient une
// avalanche de notifs a chaque demarrage.
const FRESHNESS_HOURS = 48

/**
 * Detection des missions postees par l'user qui n'ont pas trouve preneur.
 * Critere : AVAILABLE/STALE + creees dans la fenetre [now - FRESHNESS_HOURS,
 * now - STALENESS_MIN] + AUCUNE offre PENDING en cours. Ce signal alimente
 * le notifier "course pas prise" (cf. usePostedMissionUntakenNotifier web ET
 * mobile), pour pousser le poster a republier dans d'autres groupes ou
 * annuler.
 *
 * Cross-platform : utilise getSupabaseClient() (singleton inject au boot).
 */
export const untakenMissionService = {
  async getStuck(userId: string): Promise<Mission[]> {
    const supabase = getSupabaseClient()
    const now = Date.now()
    const cutoffIso = new Date(now - STALENESS_MIN * 60_000).toISOString()
    const floorIso = new Date(now - FRESHNESS_HOURS * 3_600_000).toISOString()
    const nowIso = new Date().toISOString()

    const { data: candidates, error: e1 } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('shared_by', userId)
      .in('status', ['AVAILABLE', 'STALE'])
      .lt('created_at', cutoffIso)
      .gt('created_at', floorIso)
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
