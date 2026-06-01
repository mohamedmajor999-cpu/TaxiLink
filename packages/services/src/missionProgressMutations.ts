import { getSupabaseClient } from './lib/client'

// Mutations granulaires sur le cycle de vie d'une course IN_PROGRESS.
// Ne touchent pas au champ `status` (qui reste IN_PROGRESS) — uniquement
// les horodatages additifs introduits par la migration
// 20260501_missions_progress_timestamps.sql.
//
// Toutes ces methodes supposent que la course est deja assignee au driver
// (status = 'IN_PROGRESS' et driver_id = auth.uid()), garanti par la RLS
// "Gestion mission chauffeur".

export const missionProgressMutations = {
  /** Le chauffeur a quitte sa position pour aller chercher le patient. */
  async markEnRoute(missionId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('missions')
      .update({ enroute_at: new Date().toISOString() })
      .eq('id', missionId)
      .eq('status', 'IN_PROGRESS')
    if (error) throw new Error(error.message)
  },

  /**
   * Le chauffeur est physiquement arrive a l'adresse de prise en charge,
   * detecte par geofence GPS (rayon 80m, 2min de dwell). Pose juste le
   * timestamp d'arrivee, le pickup_at viendra quand on quittera la zone.
   */
  async markArrivedAtPickup(missionId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('missions')
      .update({ arrived_at_pickup_at: new Date().toISOString() })
      .eq('id', missionId)
      .eq('status', 'IN_PROGRESS')
    if (error) throw new Error(error.message)
  },

  /** Le patient est monte dans le vehicule. */
  async markOnBoard(missionId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('missions')
      .update({ pickup_at: new Date().toISOString() })
      .eq('id', missionId)
      .eq('status', 'IN_PROGRESS')
    if (error) throw new Error(error.message)
  },

  /**
   * Le chauffeur est physiquement arrive a la destination, detecte par
   * geofence GPS (rayon 100m, 2min de dwell). Pose juste le timestamp
   * d'arrivee, le dropoff_at viendra quand on quittera la zone.
   */
  async markArrivedAtDest(missionId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('missions')
      .update({ arrived_at_dest_at: new Date().toISOString() })
      .eq('id', missionId)
      .eq('status', 'IN_PROGRESS')
    if (error) throw new Error(error.message)
  },

  /**
   * Le patient a ete depose. NE cloture PAS la course (status reste
   * IN_PROGRESS) — laisse le temps au chauffeur de saisir signature, photo
   * bon de transport, prix definitif avant le `complete()`.
   */
  async markDropped(missionId: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('missions')
      .update({ dropoff_at: new Date().toISOString() })
      .eq('id', missionId)
      .eq('status', 'IN_PROGRESS')
    if (error) throw new Error(error.message)
  },

  /**
   * Patient absent au RDV. Course cloturee mais flaguee `no_show=true` pour
   * exclusion du CA et facturation CPAM differente. Le motif est trace dans
   * `notes` pour l'historique.
   *
   * Filtre status : ACCEPTED ou IN_PROGRESS. Le chauffeur peut arriver sur
   * place sans avoir tape "Je pars chercher le patient" et constater l'absence
   * → action accessible depuis l'agenda (ACCEPTED) ET la carte active
   * (IN_PROGRESS). Bloque DONE/AVAILABLE pour eviter de cloturer 2 fois.
   */
  async markNoShow(missionId: string, reason: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { data: current } = await supabase
      .from('missions')
      .select('notes')
      .eq('id', missionId)
      .single()
    const existingNotes = current?.notes ?? ''
    const marker = `[No-show ${new Date().toISOString()}: ${reason}]`
    const merged = existingNotes ? `${marker}\n${existingNotes}` : marker
    const { data, error } = await supabase
      .from('missions')
      .update({
        status: 'DONE',
        completed_at: new Date().toISOString(),
        no_show: true,
        notes: merged,
      })
      .eq('id', missionId)
      .in('status', ['ACCEPTED', 'IN_PROGRESS'])
      .select('id')
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
      throw new Error('Action impossible : la course n\'est pas en cours.')
    }
  },
}
