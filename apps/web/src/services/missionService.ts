import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api'
import { broadcastMissionAccepted } from '@/lib/missionBroadcast'
import { missionQueries } from './missionQueries'
import type { Mission } from '@/lib/supabase/types'
import type { MissionInput } from '@/lib/validators'

const missionMutations = {
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

    await broadcastMissionAccepted(supabase, missionId)
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

  /** Créer une course manuellement dans l'agenda (saisie chauffeur) */
  async createManual(driverId: string, data: {
    departure: string
    destination: string
    scheduledAt: string
    type: 'CPAM' | 'PRIVE' | 'TAXILINK'
    priceEur: number | null
    patientName: string | null
    notes: string | null
  }): Promise<Mission> {
    const supabase = createClient()
    const { data: mission, error } = await supabase
      .from('missions')
      .insert({
        driver_id: driverId,
        departure: data.departure,
        destination: data.destination,
        scheduled_at: data.scheduledAt,
        type: data.type,
        price_eur: data.priceEur,
        patient_name: data.patientName,
        notes: data.notes,
        status: 'ACCEPTED',
        visibility: 'PRIVATE',
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mission
  },
}

export const missionService = {
  ...missionQueries,
  ...missionMutations,
}
