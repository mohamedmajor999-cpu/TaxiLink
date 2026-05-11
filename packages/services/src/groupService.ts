import { getSupabaseClient } from './lib/client'
import type { Group, GroupMember, GroupRole } from '@taxilink/core'

export const groupService = {
  /** Groupes dont le chauffeur connecte est membre (avec memberCount) */
  async getMyGroups(driverId: string): Promise<Group[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, description, created_by, created_at, fleet_org_id)')
      .eq('driver_id', driverId)
    if (error) throw error

    type GroupRow = { id: string; name: string; description: string | null; created_by: string; created_at: string; fleet_org_id: string | null }
    const rows = (data ?? []) as Array<{ groups: GroupRow | null }>
    const groups: Group[] = rows
      .map((row) => row.groups)
      .filter((g): g is GroupRow => g !== null)
      .map((g) => ({
        id: g.id, name: g.name, description: g.description,
        createdBy: g.created_by, createdAt: g.created_at,
        fleetOrgId: g.fleet_org_id ?? null,
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
    const rows = (data ?? []) as MemberRow[]
    return rows.map((row) => ({
      id: row.id, groupId: row.group_id, driverId: row.driver_id,
      role: row.role, joinedAt: row.joined_at,
      fullName: row.drivers?.profiles?.full_name ?? null,
    }))
  },

  /** Noms des groupes auxquels une mission est partagee */
  async getNamesForMission(missionId: string): Promise<string[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('mission_groups')
      .select('groups(name)')
      .eq('mission_id', missionId)
    if (error) throw error
    const rows = (data ?? []) as Array<{ groups: { name: string } | null }>
    return rows.map((r) => r.groups?.name).filter((n): n is string => !!n)
  },

  /** Creer un groupe et y ajouter le createur comme admin */
  async create(name: string, description: string | null, createdBy: string): Promise<Group> {
    const supabase = getSupabaseClient()
    const { data: group, error: gErr } = await supabase
      .from('groups').insert({ name, description, created_by: createdBy }).select().single()
    if (gErr) throw gErr
    const { error: mErr } = await supabase
      .from('group_members').insert({ group_id: group.id, driver_id: createdBy, role: 'admin' })
    if (mErr) throw mErr
    return {
      id: group.id, name: group.name, description: group.description,
      createdBy: group.created_by, createdAt: group.created_at ?? new Date().toISOString(), memberCount: 1,
    }
  },

  /** Rejoindre un groupe via son ID */
  async join(groupId: string, driverId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('group_members').insert({ group_id: groupId, driver_id: driverId, role: 'member' })
    if (error) throw error
  },

  /** Quitter un groupe */
  async leave(groupId: string, driverId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('group_members').delete().eq('group_id', groupId).eq('driver_id', driverId)
    if (error) throw error
  },

  /** Supprimer un groupe (admin uniquement) */
  async deleteGroup(groupId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error: mErr } = await supabase.from('group_members').delete().eq('group_id', groupId)
    if (mErr) throw mErr
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) throw error
  },

  // Realtime sur la table group_members (INSERT/DELETE) — utilise par
  // useDriverGroupes pour rafraichir la liste des groupes du chauffeur quand
  // il en rejoint ou en quitte un.
  subscribeMembers(onChange: () => void): () => void {
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel('group-members-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members' }, () => onChange())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_members' }, () => onChange())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },

  // Realtime sur l'activite des groupes : mission_groups (any event, filtre
  // par groupIds) + missions UPDATE. Utilise par useDriverGroupesScreen pour
  // rafraichir les compteurs / pulses des cards de groupe.
  subscribeActivity(groupIds: string[], onChange: () => void): () => void {
    const supabase = getSupabaseClient()
    const idSet = new Set(groupIds)
    const channel = supabase
      .channel('groupes-summary-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_groups' }, (payload) => {
        const newRow = payload.new as { group_id?: string } | null
        const oldRow = payload.old as { group_id?: string } | null
        const gid = newRow?.group_id ?? oldRow?.group_id
        if (gid && idSet.has(gid)) onChange()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'missions' }, () => onChange())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}
