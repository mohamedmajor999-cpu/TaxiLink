import { createClient } from '@/lib/supabase/client'
import type { Mission } from '@/lib/supabase/types'

// Plafond par défaut pour les requêtes listes — évite une charge DB non bornée
// quand la table missions grandit. Les consommateurs peuvent passer une valeur
// plus haute si le cas d'usage le justifie.
const DEFAULT_LIMIT = 100

// Tolérance sur le passé : une course AVAILABLE dont scheduled_at est dans
// la dernière journée reste visible. Un chauffeur peut poster "16h00" à 16h03
// (arrondi UX) — la course doit rester affichable pour être prise.
const PAST_TOLERANCE_MS = 24 * 60 * 60 * 1000

export const missionQueries = {
  /**
   * Feed des missions disponibles.
   * @param departments liste de codes dept (ex: ['75','93']). Si vide/undefined,
   *   aucun filtre appliqué (comportement legacy pour chauffeur sans préférences).
   */
  async getAvailable(departments?: string[], limit = DEFAULT_LIMIT): Promise<Mission[]> {
    const supabase = createClient()
    const since = new Date(Date.now() - PAST_TOLERANCE_MS).toISOString()
    let query = supabase
      .from('missions')
      .select('*, mission_groups(group_id), publisher:profiles!missions_client_id_fkey(full_name)')
      .eq('status', 'AVAILABLE')
      .gt('scheduled_at', since)

    if (departments && departments.length > 0) {
      query = query.in('departement', departments)
    }

    const { data, error } = await query
      .order('scheduled_at', { ascending: true })
      .limit(limit)
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
