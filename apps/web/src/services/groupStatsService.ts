import { createClient } from '@/lib/supabase/client'
import type { GroupMember, GroupMemberStats, GroupRole } from '@taxilink/core'

const supabase = createClient()

// TTL de presence : un chauffeur compte comme "en ligne" uniquement si son
// last_seen_at est < ONLINE_TTL_MS. Le client ping toutes les 60s
// (useDriverHeartbeat) ; on tolere donc un retard d'un cycle.
const ONLINE_TTL_MS = 120_000

function isFreshlyOnline(isOnline: boolean | undefined, lastSeenAt: string | null | undefined): boolean {
  if (!isOnline) return false
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_TTL_MS
}

export interface GroupActivitySummary {
  available:      number
  exchanged7d:    number
  reprisePercent: number
  onlineCount:    number
  /** ISO date du dernier événement (post ou acceptation) sur les 7 derniers
   *  jours. Null si aucun événement. Utilisé côté client pour décider
   *  d'afficher la pastille « nouveau » si > lastVisited. */
  lastEventAt:    string | null
}

export interface GroupDailyActivity {
  date:  string
  count: number
}

export const groupStatsService = {
  /** Membres d'un groupe */
  async getMembers(groupId: string): Promise<GroupMember[]> {
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
    const [membersRes, missionsRes] = await Promise.all([
      supabase.from('group_members')
        .select('driver_id, role, drivers(profiles(full_name, first_name, last_name, department, phone), is_online, last_seen_at)')
        .eq('group_id', groupId),
      supabase.from('mission_groups')
        .select('missions!inner(shared_by, driver_id, created_at)')
        .eq('group_id', groupId)
        .gte('missions.created_at', since),
    ])
    if (membersRes.error) throw membersRes.error

    const shared:   Record<string, number> = {}
    const accepted: Record<string, number> = {}
    for (const row of (missionsRes.data ?? []) as Array<{ missions: { shared_by: string | null; driver_id: string | null } | null }>) {
      const m = row.missions
      if (!m) continue
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

  /** Résumé d'activité d'un groupe sur 7 jours glissants (4 compteurs agrégés) */
  async getActivitySummary(groupId: string): Promise<GroupActivitySummary> {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const [onlineRes, exchangedRes, availableRes] = await Promise.all([
      supabase.from('group_members')
        .select('drivers(is_online, last_seen_at)')
        .eq('group_id', groupId),
      supabase.from('mission_groups')
        .select('missions!inner(driver_id, created_at, accepted_at)')
        .eq('group_id', groupId)
        .gte('missions.created_at', since),
      supabase.from('mission_groups')
        .select('missions!inner(status)')
        .eq('group_id', groupId)
        .eq('missions.status', 'OFFERED'),
    ])
    type OnlineRow = { drivers: { is_online: boolean | null; last_seen_at: string | null } | null }
    const onlineCount = ((onlineRes.data ?? []) as OnlineRow[])
      .filter((r) => isFreshlyOnline(r.drivers?.is_online ?? false, r.drivers?.last_seen_at)).length
    const rows          = ((exchangedRes.data ?? []) as Array<{ missions: { driver_id: string | null; created_at: string; accepted_at: string | null } | null }>)
    const exchanged7d   = rows.length
    const accepted7d    = rows.filter((r) => !!r.missions?.driver_id).length
    const reprisePercent = exchanged7d > 0 ? Math.round((accepted7d / exchanged7d) * 100) : 0
    const available     = (availableRes.data ?? []).length
    let lastEventAt: string | null = null
    for (const r of rows) {
      const ts = r.missions?.accepted_at ?? r.missions?.created_at ?? null
      if (ts && (!lastEventAt || ts > lastEventAt)) lastEventAt = ts
    }
    return { available, exchanged7d, reprisePercent, onlineCount, lastEventAt }
  },

  /** Nombre de courses partagées par jour sur les N derniers jours (pour la mini-barre) */
  async getDailyActivity(groupId: string, days = 7): Promise<GroupDailyActivity[]> {
    const since = new Date(Date.now() - days * 86_400_000).toISOString()
    const { data } = await supabase.from('mission_groups')
      .select('missions!inner(created_at)')
      .eq('group_id', groupId)
      .gte('missions.created_at', since)
    const buckets: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
      buckets[d] = 0
    }
    for (const row of (data ?? []) as Array<{ missions: { created_at: string } | null }>) {
      const d = row.missions?.created_at?.slice(0, 10)
      if (d && d in buckets) buckets[d] += 1
    }
    return Object.entries(buckets).map(([date, count]) => ({ date, count }))
  },
}
