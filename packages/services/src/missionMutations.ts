import { getSupabaseClient } from './lib/client'
import { api } from './lib/api'
import { broadcastMissionAccepted } from './lib/missionBroadcast'
import type { Mission } from '@taxilink/supabase-types'
import type { MissionInput } from '@taxilink/core'

export const missionMutations = {
  /**
   * Accepter une mission.
   * Leve une erreur si la mission a deja ete prise par un autre chauffeur
   * (la condition .eq('status','AVAILABLE') garantit l'atomicite).
   */
  async accept(missionId: string, driverId: string): Promise<void> {
    const supabase = getSupabaseClient()
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
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('missions')
      .update({ status: 'DONE', completed_at: new Date().toISOString() })
      .eq('id', missionId)
    if (error) throw new Error(error.message)
  },

  /**
   * Annuler une mission cote chauffeur : la remet dans le pool AVAILABLE,
   * libere le driver_id, et trace le motif dans `notes`. La course redevient
   * donc visible par les autres chauffeurs.
   */
  async cancel(missionId: string, reason: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { data: current } = await supabase
      .from('missions')
      .select('notes')
      .eq('id', missionId)
      .single()
    const existingNotes = current?.notes ?? ''
    const marker = `[Annulation chauffeur ${new Date().toISOString()}: ${reason}]`
    const merged = existingNotes ? `${marker}\n${existingNotes}` : marker
    // Filtre status : la RLS "Gestion mission chauffeur" autorise l'UPDATE
    // tant que driver_id = auth.uid(), SANS verifier le status. Sans le filtre
    // ci-dessous, un chauffeur pouvait "annuler" une mission deja DONE/EXPIRED
    // et la remettre AVAILABLE -> stats perdues, mission ré-executee par un
    // autre driver, double facturation possible.
    const { data, error } = await supabase
      .from('missions')
      .update({
        driver_id: null,
        status: 'AVAILABLE',
        accepted_at: null,
        notes: merged,
      })
      .eq('id', missionId)
      .in('status', ['ACCEPTED', 'IN_PROGRESS'])
      .select('id')
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
      throw new Error('Annulation impossible : la course n\'est plus en cours.')
    }
  },

  /** Creer une nouvelle mission (passe par l'API route pour la validation serveur) */
  async create(input: MissionInput): Promise<Mission> {
    const { mission } = await api.post<{ mission: Mission }>('/api/missions', input)
    return mission
  },

  /** Mettre a jour une mission existante (statut AVAILABLE uniquement, ownership verifie cote serveur) */
  async update(id: string, patch: MissionInput): Promise<Mission> {
    const { mission } = await api.patch<{ mission: Mission }>(`/api/missions/${id}`, patch)
    return mission
  },

  /** Supprimer une mission postee (statut AVAILABLE uniquement, ownership verifie cote serveur) */
  async remove(id: string): Promise<void> {
    await api.delete<{ ok: true }>(`/api/missions/${id}`)
  },

  /** Booster le prix d'une mission AVAILABLE postee par soi-meme (RLS verifie shared_by). */
  async boostPrice(id: string, deltaEur: number): Promise<Mission> {
    const supabase = getSupabaseClient()
    const { data: cur, error: rErr } = await supabase
      .from('missions')
      .select('price_eur')
      .eq('id', id)
      .single()
    if (rErr) throw new Error(rErr.message)
    const newPrice = Number(cur?.price_eur ?? 0) + deltaEur
    const { data, error } = await supabase
      .from('missions')
      .update({ price_eur: newPrice })
      .eq('id', id)
      .eq('status', 'AVAILABLE')
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Mission
  },
}
