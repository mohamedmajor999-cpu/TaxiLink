import { createClient } from '@/lib/supabase/client'
import type { GroupMember, GroupMemberStats } from '@taxilink/core'

const supabase = createClient()

export const groupStatsService = {
  /** Membres d'un groupe */
  async getMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('id, group_id, driver_id, role, joined_at, drivers(profiles(full_name))')
      .eq('group_id', groupId)
    if (error) throw error
    return (data ?? []).map((row: any) => ({
      id: row.id, groupId: row.group_id, driverId: row.driver_id,
      role: row.role, joinedAt: row.joined_at,
      fullName: row.drivers?.profiles?.full_name ?? null,
    }))
  },

  /** Stats d'activité par membre pour une période donnée */
  async getMemberStats(groupId: string, since: string): Promise<GroupMemberStats[]> {
    const [membersRes, missionsRes] = await Promise.all([
      supabase.from('group_members')
        .select('driver_id, role, drivers(profiles(full_name, first_name, last_name, department), is_online)')
        .eq('group_id', groupId),
      supabase.from('missions')
        .select('shared_by, driver_id')
        .eq('group_id', groupId)
        .gte('created_at', since),
    ])
    if (membersRes.error) throw membersRes.error

    const shared:   Record<string, number> = {}
    const accepted: Record<string, number> = {}
    for (const m of missionsRes.data ?? []) {
      if (m.shared_by) shared[m.shared_by]   = (shared[m.shared_by]   ?? 0) + 1
      if (m.driver_id) accepted[m.driver_id] = (accepted[m.driver_id] ?? 0) + 1
    }
    return (membersRes.data ?? [])
      .map((row: any) => ({
        driverId:     row.driver_id,
        fullName:     row.drivers?.profiles?.full_name  ?? null,
        firstName:    row.drivers?.profiles?.first_name ?? null,
        lastName:     row.drivers?.profiles?.last_name  ?? null,
        department:   row.drivers?.profiles?.department ?? null,
        isOnline:     row.drivers?.is_online ?? false,
        role:         row.role,
        sharedCount:  shared[row.driver_id]   ?? 0,
        acceptedCount: accepted[row.driver_id] ?? 0,
      }))
      .sort((a, b) => (b.sharedCount + b.acceptedCount) - (a.sharedCount + a.acceptedCount))
  },
}
