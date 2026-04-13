import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMember } from '@taxilink/core'

const supabase = createClient()

export const groupService = {
  /** Groupes dont le chauffeur connecté est membre */
  async getMyGroups(driverId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, description, created_by, created_at, updated_at)')
      .eq('driver_id', driverId)

    if (error) throw error

    return (data ?? []).map((row: any) => {
      const g = row.groups
      return {
        id:          g.id,
        name:        g.name,
        description: g.description,
        createdBy:   g.created_by,
        createdAt:   g.created_at,
      }
    })
  },

  /** Membres d'un groupe */
  async getMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('id, group_id, driver_id, role, joined_at, drivers(profiles(full_name))')
      .eq('group_id', groupId)

    if (error) throw error

    return (data ?? []).map((row: any) => ({
      id:       row.id,
      groupId:  row.group_id,
      driverId: row.driver_id,
      role:     row.role,
      joinedAt: row.joined_at,
      fullName: row.drivers?.profiles?.full_name ?? null,
    }))
  },

  /** Créer un groupe et y ajouter le créateur comme admin */
  async create(name: string, description: string | null, createdBy: string): Promise<Group> {
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .insert({ name, description, created_by: createdBy })
      .select()
      .single()

    if (gErr) throw gErr

    const { error: mErr } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, driver_id: createdBy, role: 'admin' })

    if (mErr) throw mErr

    return {
      id:          group.id,
      name:        group.name,
      description: group.description,
      createdBy:   group.created_by,
      createdAt:   group.created_at,
    }
  },

  /** Rejoindre un groupe via son ID */
  async join(groupId: string, driverId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, driver_id: driverId, role: 'member' })

    if (error) throw error
  },

  /** Quitter un groupe */
  async leave(groupId: string, driverId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('driver_id', driverId)

    if (error) throw error
  },
}
