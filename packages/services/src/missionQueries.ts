import { getSupabaseClient } from './lib/client'
import type { Mission } from '@taxilink/supabase-types'

// Plafond par defaut pour les requetes listes — evite une charge DB non bornee
// quand la table missions grandit. Les consommateurs peuvent passer une valeur
// plus haute si le cas d'usage le justifie.
const DEFAULT_LIMIT = 100

export const missionQueries = {
  /**
   * Feed des missions disponibles.
   * @param departments liste de codes dept (ex: ['75','93']). Si vide/undefined,
   *   aucun filtre applique (comportement legacy pour chauffeur sans preferences).
   */
  async getAvailable(departments?: string[], limit = DEFAULT_LIMIT): Promise<Mission[]> {
    const supabase = getSupabaseClient()
    // RGPD : on passe par la fonction RPC `get_marketplace_missions` qui masque
    // patient_name (initiales) + phone (NULL) + notes (NULL) cote serveur. La
    // PII patient ne quitte pas Postgres en clair pour le feed marketplace.
    // Cf. migration 20260504_marketplace_masked_rpc.sql.
    const { data, error } = await supabase.rpc('get_marketplace_missions', {
      p_departments: departments && departments.length > 0 ? departments : undefined,
      p_limit: limit,
    })
    if (error) throw new Error(error.message)
    // Le RPC retourne SETOF JSONB : chaque ligne est deja un objet Mission
    // (avec mission_groups embedded). Cast jusqu'a regen des types Supabase.
    return (data ?? []) as unknown as Mission[]
  },

  async getCurrentForDriver(driverId: string): Promise<Mission | null> {
    const supabase = getSupabaseClient()
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

  /** Historique des missions terminees d'un chauffeur */
  async getDoneByDriver(driverId: string, limit = DEFAULT_LIMIT): Promise<Mission[]> {
    const supabase = getSupabaseClient()
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

  /** Toutes les missions d'un client, triees par date decroissante */
  async getClientMissions(clientId: string, limit = DEFAULT_LIMIT): Promise<Mission[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return data ?? []
  },

  /** Recupere une mission par son ID */
  async getById(id: string): Promise<Mission | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*, mission_groups(group_id)')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  },

  /**
   * Mobile RGPD (audit H-01) : recupere une mission via le RPC masque
   * `get_mission_detail`. La PII patient (nom/tel/notes/signature/voucher) n'est
   * renvoyee que si l'appelant est proprietaire / chauffeur assigne / auteur ;
   * sinon elle est NULL cote serveur (et une mission non-AVAILABLE non possedee
   * leve une erreur → null ici). A utiliser cote mobile a la place de getById
   * pour le detail/offre, afin que la PII ne quitte pas Postgres en clair.
   * Le RPC ne renvoie PAS l'embed mission_groups (non consomme cote mobile).
   */
  async getByIdMasked(id: string): Promise<Mission | null> {
    const supabase = getSupabaseClient()
    // get_mission_detail a ete cree en prod (migration audit 20260529). Les types
    // Supabase generes (packages/supabase-types/src/database.types.ts) ne l'incluent
    // pas encore → directive ci-dessous jusqu'au prochain `supabase gen types`.
    // Le nom du RPC et l'argument p_mission_id sont corrects. Quand les types seront
    // regeneres, cette directive deviendra "unused" et signalera son propre retrait.
    // @ts-expect-error nom de RPC absent des types generes (cf. commentaire ci-dessus)
    const { data, error } = await supabase.rpc('get_mission_detail', { p_mission_id: id })
    if (error || !data) return null
    return data as unknown as Mission
  },

  /**
   * Annonces postees par un user (shared_by = userId) depuis une date pivot.
   * Pas de filtre status : on inclut DONE pour afficher les annonces effectuees
   * dans le tracker de l'onglet "Mes annonces".
   */
  async getSharedByUser(userId: string, sinceIso: string): Promise<Mission[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('shared_by', userId)
      .gte('scheduled_at', sinceIso)
      .order('scheduled_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  /** Agenda d'un chauffeur : ses missions assignees non terminees, triees par date croissante */
  async getAgenda(driverId: string, limit = DEFAULT_LIMIT): Promise<Mission[]> {
    const supabase = getSupabaseClient()
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
