import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api'
import type { Mission } from '@/lib/supabase/types'
import type { MissionInput } from '@/lib/validators'

export const missionService = {
  async getAvailable(): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*')
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
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'IN_PROGRESS')
      .order('accepted_at', { ascending: false })
      .limit(1)
    if (error) throw new Error(error.message)
    return data?.[0] ?? null
  },

  /**
   * Accepter une mission.
   * Lève une erreur si la mission a déjà été prise par un autre chauffeur
   * (la condition .eq('status','AVAILABLE') garantit l'atomicité).
   */
  async accept(missionId: string, driverId: string): Promise<void> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .update({
        driver_id: driverId,
        status: 'IN_PROGRESS',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .eq('status', 'AVAILABLE')
      .select()

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
      throw new Error('Mission déjà acceptée par un autre chauffeur')
    }
  },

  async complete(missionId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('missions')
      .update({ status: 'DONE', completed_at: new Date().toISOString() })
      .eq('id', missionId)
    if (error) throw new Error(error.message)
  },

  /**
   * Annuler une mission côté chauffeur : la remet dans le pool AVAILABLE,
   * libère le driver_id, et trace le motif dans `notes`. La course redevient
   * donc visible par les autres chauffeurs.
   */
  async cancel(missionId: string, reason: string): Promise<void> {
    const supabase = createClient()
    const { data: current } = await supabase
      .from('missions')
      .select('notes')
      .eq('id', missionId)
      .single()
    const existingNotes = current?.notes ?? ''
    const marker = `[Annulation chauffeur ${new Date().toISOString()}: ${reason}]`
    const merged = existingNotes ? `${marker}\n${existingNotes}` : marker
    const { error } = await supabase
      .from('missions')
      .update({
        driver_id: null,
        status: 'AVAILABLE',
        accepted_at: null,
        notes: merged,
      })
      .eq('id', missionId)
    if (error) throw new Error(error.message)
  },

  /** Historique des missions terminées d'un chauffeur */
  async getDoneByDriver(driverId: string): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*')
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
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  /** Créer une nouvelle mission (passe par l'API route pour la validation serveur) */
  async create(input: MissionInput): Promise<Mission> {
    const { mission } = await api.post<{ mission: Mission }>('/api/missions', input)
    return mission
  },

  /** Mettre à jour une mission existante (statut AVAILABLE uniquement, ownership vérifié côté serveur) */
  async update(id: string, patch: MissionInput): Promise<Mission> {
    const { mission } = await api.patch<{ mission: Mission }>(`/api/missions/${id}`, patch)
    return mission
  },

  /** Supprimer une mission postée (statut AVAILABLE uniquement, ownership vérifié côté serveur) */
  async remove(id: string): Promise<void> {
    await api.delete<{ ok: true }>(`/api/missions/${id}`)
  },

  /** Agenda d'un chauffeur : ses missions assignées non terminées, triées par date croissante */
  async getAgenda(driverId: string): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('driver_id', driverId)
      .neq('status', 'DONE')
      .order('scheduled_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  },
}
