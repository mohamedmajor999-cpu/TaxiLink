import { createClient } from '@/lib/supabase/client'

export interface OrgDriver {
  id: string
  name: string
  is_online: boolean
}

export const patronCoursesService = {
  async assignToDriver(missionId: string, driverId: string): Promise<void> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('patron_assign_mission', {
      target_mission_id: missionId,
      target_driver_id: driverId,
    })
    if (error) throw new Error(error.message)
    const result = (data ?? {}) as { success?: boolean; error?: string }
    if (!result.success) throw new Error(result.error ?? 'ASSIGN_FAILED')
  },

  async getOrgDrivers(orgId: string): Promise<OrgDriver[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('drivers')
      .select('id, is_online, profiles!inner(first_name, last_name)')
      .eq('organization_id', orgId)
      .order('is_online', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((d) => {
      const p = d.profiles as unknown as { first_name: string | null; last_name: string | null }
      return {
        id: d.id,
        name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Chauffeur',
        is_online: d.is_online,
      }
    })
  },
}
