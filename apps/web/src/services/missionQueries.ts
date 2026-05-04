import { createClient } from '@/lib/supabase/client'
import type { Mission } from '@/lib/supabase/types'

// Plafond par défaut pour les requêtes listes — évite une charge DB non bornée
// quand la table missions grandit. Les consommateurs peuvent passer une valeur
// plus haute si le cas d'usage le justifie.
const DEFAULT_LIMIT = 100

export const missionQueries = {
  /**
   * Feed des missions disponibles.
   * @param departments liste de codes dept (ex: ['75','93']). Si vide/undefined,
   *   aucun filtre appliqué (comportement legacy pour chauffeur sans préférences).
   */
  async getAvailable(departments?: string[], limit = DEFAULT_LIMIT): Promise<Mission[]> {
    const supabase = createClient()
    // RGPD : on passe par la fonction RPC `get_marketplace_missions` qui masque
    // patient_name (initiales) + phone (NULL) + notes (NULL) cote serveur. La
    // PII patient ne quitte pas Postgres en clair pour le feed marketplace.
    // Cf. migration 20260504_marketplace_masked_rpc.sql.
    const { data, error } = await supabase.rpc('get_marketplace_missions', {
      p_departments: departments && departments.length > 0 ? departments : null,
      p_limit:       limit,
    })
    if (error) throw new Error(error.message)
    // Le RPC retourne SETOF JSONB : chaque ligne est deja un objet Mission
    // (avec mission_groups embedded). Cast jusqu'a regen des types Supabase.
    return (data ?? []) as unknown as Mission[]
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
  async getDoneByDriver(driverId: string, limit = DEFAULT_LIMIT): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('driver_id', driverId)
      .eq('status', 'DONE')
      .order('completed_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return data ?? []
  },

  /** Toutes les missions d'un client, triées par date décroissante */
  async getClientMissions(clientId: string, limit = DEFAULT_LIMIT): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false })
      .limit(limit)
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
  async getAgenda(driverId: string, limit = DEFAULT_LIMIT): Promise<Mission[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('driver_id', driverId)
      .neq('status', 'DONE')
      .order('scheduled_at', { ascending: true })
      .limit(limit)
    if (error) throw new Error(error.message)
    return data ?? []
  },
}
