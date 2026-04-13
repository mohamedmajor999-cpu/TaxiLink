import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMember, GroupMemberStats } from '@taxilink/core'

const supabase = createClient()

export const groupService = {
  /** Groupes dont le chauffeur connecté est membre (avec memberCount) */
  async getMyGroups(driverId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, description, created_by, created_at)')
      .eq('driver_id', driverId)
    if (error) throw error

    const groups: Group[] = (data ?? []).map((row: any) => ({
      id: row.groups.id, name: row.groups.name, description: row.groups.description,
      createdBy: row.groups.created_by, createdAt: row.groups.created_at,
    }))
    if (groups.length === 0) return groups

    const { data: memberRows } = await supabase
      .from('group_members').select('group_id').in('group_id', groups.map((g) => g.id))
    const countMap: Record<string, number> = {}
    for (const row of memberRows ?? []) countMap[row.group_id] = (countMap[row.group_id] ?? 0) + 1
    return groups.map((g) => ({ ...g, memberCount: countMap[g.id] ?? 0 }))
  },

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

  /** Créer un groupe et y ajouter le créateur comme admin */
  async create(name: string, description: string | null, createdBy: string): Promise<Group> {
    const { data: group, error: gErr } = await supabase
      .from('groups').insert({ name, description, created_by: createdBy }).select().single()
    if (gErr) throw gErr
    const { error: mErr } = await supabase
      .from('group_members').insert({ group_id: group.id, driver_id: createdBy, role: 'admin' })
    if (mErr) throw mErr
    return {
      id: group.id, name: group.name, description: group.description,
      createdBy: group.created_by, createdAt: group.created_at, memberCount: 1,
    }
  },

  /** Rejoindre un groupe via son ID */
  async join(groupId: string, driverId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members').insert({ group_id: groupId, driver_id: driverId, role: 'member' })
    if (error) throw error
  },

  /** Quitter un groupe */
  async leave(groupId: string, driverId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members').delete().eq('group_id', groupId).eq('driver_id', driverId)
    if (error) throw error
  },

  /** Supprimer un groupe (admin uniquement) */
  async deleteGroup(groupId: string): Promise<void> {
    const { error: mErr } = await supabase.from('group_members').delete().eq('group_id', groupId)
    if (mErr) throw mErr
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) throw error
  },
}
