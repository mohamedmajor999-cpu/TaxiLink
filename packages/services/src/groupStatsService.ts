import { getSupabaseClient } from './lib/client'
import type { GroupMember, GroupMemberStats, GroupRole } from '@taxilink/core'
import {
  isFreshlyOnline,
  type GroupActivitySummary,
  type GroupDailyActivity,
} from './groupStatsService.helpers'

export type { GroupActivitySummary, GroupDailyActivity }

// Réplique apps/web/src/services/groupStatsService.ts (init paresseux du client supabase
// pour rester compatible mobile : on récupère via getSupabaseClient() à chaque appel).
export const groupStatsService = {
  /** Membres d'un groupe */
  async getMembers(groupId: string): Promise<GroupMember[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('group_members')
      .select('id, group_id, driver_id, role, joined_at, drivers(profiles(full_name))')
      .eq('group_id', groupId)
    if (error) throw error
    type MemberRow = {
      id: string; group_id: string; driver_id: string; role: GroupRole; joined_at: string
      drivers: { profiles: { full_name: string | null } | null } | null
    }
    return ((data ?? []) as MemberRow[]).map((row) => ({
      id: row.id, groupId: row.group_id, driverId: row.driver_id,
      role: row.role, joinedAt: row.joined_at,
      fullName: row.drivers?.profiles?.full_name ?? null,
    }))
  },

  /** Stats d'activité par membre pour une période donnée */
  async getMemberStats(groupId: string, since: string): Promise<GroupMemberStats[]> {
    const supabase = getSupabaseClient()
    const [membersRes, activityRes] = await Promise.all([
      supabase.from('group_members')
        .select('driver_id, role, drivers(profiles(full_name, first_name, last_name, department, phone), is_online, last_seen_at)')
        .eq('group_id', groupId),
      // Lignes d'activite du groupe via RPC masque get_group_activity_rows
      // (SECURITY DEFINER, verifie l'appartenance au groupe). Aucune PII renvoyee.
      // Prerequis au resserrement de la policy RLS SELECT missions (audit H-01).
      // @ts-expect-error RPC absent des types Supabase generes (cf. getByIdMasked)
      supabase.rpc('get_group_activity_rows', { p_group_id: groupId, p_since: since }),
    ])
    if (membersRes.error) throw membersRes.error

    const shared:   Record<string, number> = {}
    const accepted: Record<string, number> = {}
    for (const m of (activityRes.data ?? []) as Array<{ shared_by: string | null; driver_id: string | null }>) {
      if (m.shared_by) shared[m.shared_by]   = (shared[m.shared_by]   ?? 0) + 1
      if (m.driver_id) accepted[m.driver_id] = (accepted[m.driver_id] ?? 0) + 1
    }
    type MemberStatsRow = {
      driver_id: string; role: GroupRole
      drivers: {
        is_online: boolean | null; last_seen_at: string | null
        profiles: {
          full_name: string | null; first_name: string | null; last_name: string | null
          department: string | null; phone: string | null
        } | null
      } | null
    }
    return ((membersRes.data ?? []) as MemberStatsRow[])
      .map((row) => ({
        driverId:     row.driver_id,
        fullName:     row.drivers?.profiles?.full_name  ?? null,
        firstName:    row.drivers?.profiles?.first_name ?? null,
        lastName:     row.drivers?.profiles?.last_name  ?? null,
        department:   row.drivers?.profiles?.department ?? null,
        phone:        row.drivers?.profiles?.phone      ?? null,
        isOnline:     isFreshlyOnline(row.drivers?.is_online ?? false, row.drivers?.last_seen_at),
        role:         row.role,
        sharedCount:  shared[row.driver_id]   ?? 0,
        acceptedCount: accepted[row.driver_id] ?? 0,
      }))
      .sort((a, b) => (b.sharedCount + b.acceptedCount) - (a.sharedCount + a.acceptedCount))
  },

  /** Résumé d'activité d'un groupe sur 7 jours glissants */
  async getActivitySummary(groupId: string): Promise<GroupActivitySummary> {
    const supabase = getSupabaseClient()
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const [onlineRes, activityRes, availableRes] = await Promise.all([
      supabase.from('group_members')
        .select('driver_id, drivers(is_online, last_seen_at)')
        .eq('group_id', groupId),
      // Activite (echangees/acceptees) + compteur dispos via RPC masques
      // (SECURITY DEFINER, appartenance verifiee). Aucune PII. Prerequis verrou
      // RLS missions (H-01). Le compteur applique status='AVAILABLE' AND scheduled_at>now() cote serveur.
      // @ts-expect-error RPC absent des types Supabase generes (cf. getByIdMasked)
      supabase.rpc('get_group_activity_rows', { p_group_id: groupId, p_since: since }),
      // @ts-expect-error RPC absent des types Supabase generes (cf. getByIdMasked)
      supabase.rpc('get_group_available_count', { p_group_id: groupId }),
    ])
    type OnlineRow = { driver_id: string | null; drivers: { is_online: boolean | null; last_seen_at: string | null } | null }
    const onlineDriverIds = ((onlineRes.data ?? []) as OnlineRow[])
      .filter((r) => isFreshlyOnline(r.drivers?.is_online ?? false, r.drivers?.last_seen_at))
      .map((r) => r.driver_id)
      .filter((id): id is string => typeof id === 'string')
    const onlineCount = onlineDriverIds.length
    const rows          = ((activityRes.data ?? []) as Array<{ driver_id: string | null; created_at: string; accepted_at: string | null }>)
    const exchanged7d   = rows.length
    const accepted7d    = rows.filter((r) => !!r.driver_id).length
    const reprisePercent = exchanged7d > 0 ? Math.round((accepted7d / exchanged7d) * 100) : 0
    const available     = (availableRes.data ?? 0) as number
    let lastEventAt: string | null = null
    for (const r of rows) {
      const ts = r.accepted_at ?? r.created_at ?? null
      if (ts && (!lastEventAt || ts > lastEventAt)) lastEventAt = ts
    }
    return { available, exchanged7d, reprisePercent, onlineCount, onlineDriverIds, lastEventAt }
  },

  /** Nombre de courses partagées par jour sur les N derniers jours */
  async getDailyActivity(groupId: string, days = 7): Promise<GroupDailyActivity[]> {
    const supabase = getSupabaseClient()
    const since = new Date(Date.now() - days * 86_400_000).toISOString()
    // @ts-expect-error RPC absent des types Supabase generes (cf. getByIdMasked)
    const { data } = await supabase.rpc('get_group_activity_rows', { p_group_id: groupId, p_since: since })
    const buckets: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
      buckets[d] = 0
    }
    for (const row of (data ?? []) as Array<{ created_at: string }>) {
      const d = row.created_at?.slice(0, 10)
      if (d && d in buckets) buckets[d] = (buckets[d] ?? 0) + 1
    }
    return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  },
}
