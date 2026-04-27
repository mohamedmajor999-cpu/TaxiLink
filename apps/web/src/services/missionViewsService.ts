import { createClient } from '@/lib/supabase/client'

// Tracking des vues de mission (compteur agrege par mission_id, jamais nominatif).
// Un trigger Postgres incremente missions.view_count a chaque INSERT unique
// (UNIQUE (mission_id, viewer_id)).

export const missionViewsService = {
  /**
   * Enregistre une vue de la mission par le chauffeur courant. Best-effort :
   * swallow ON CONFLICT (deja vu) et toute erreur RLS benigne — la vue qui
   * rate ne doit pas bloquer l'UX.
   */
  async record(missionId: string, viewerId: string): Promise<void> {
    const supabase = createClient()
    await supabase
      .from('mission_views')
      .insert({ mission_id: missionId, viewer_id: viewerId })
      .then(() => undefined, () => undefined)
  },
}
