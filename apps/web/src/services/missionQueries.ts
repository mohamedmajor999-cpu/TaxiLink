import { createClient } from '@/lib/supabase/client'
import type { Mission } from '@/lib/supabase/types'

export const missionQueries = {
  async getAvailable(): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id), publisher:profiles!missions_client_id_fkey(full_name)')
      .eq('status', 'AVAILABLE')
      .gt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getCurrentForDriver(driverId: string): Promise<Mission | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('driver_id', driverId)
      .eq('status', 'IN_PROGRESS')
      .order('accepted_at', { ascending: false })
      .limit(1)
    if (error) throw new Error(error.message)
    return data?.[0] ?? null
  },

  /** Historique des missions terminées d'un chauffeur */
  async getDoneByDriver(driverId: string): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('driver_id', driverId)
      .eq('status', 'DONE')
      .order('completed_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  /** Toutes les missions d'un client, triées par date décroissante */
  async getClientMissions(clientId: string): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  /** Récupère une mission par son ID */
  async getById(id: string): Promise<Mission | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  },

  /** Agenda d'un chauffeur : ses missions assignées non terminées, triées par date croissante */
  async getAgenda(driverId: string): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('driver_id', driverId)
      .neq('status', 'DONE')
      .order('scheduled_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  },
}
