import { getSupabaseClient } from '@taxilink/services';

// Declenche l'Edge Function `dispatch_mission` apres la creation d'une mission
// depuis le mobile (cascade d'offres par proximite 3->6->12->20->30 km).
//
// Pendant longtemps ce declenchement etait suppose venir d'un trigger DB : c'est
// FAUX (aucun trigger n'appelle dispatch_mission). Cote web, /api/missions
// l'invoque explicitement (apps/web/src/lib/dispatchTrigger.ts). Le mobile doit
// faire pareil, sinon `mission_offers` reste vide et aucune offre directe ne
// part (cf. audit fonctionnel 2026-05-29, constats ANN-02 / DISP-01).
//
// L'invoke utilise le JWT de session du chauffeur, qui est `shared_by` de la
// mission qu'il vient de creer -> autorise par la fonction (publisher).
//
// Fire-and-forget : on ne JAMAIS attendre cette promesse — la cascade tourne
// jusqu'a ~100s cote Supabase, independamment du client. Best-effort : un echec
// ne doit PAS invalider la creation de mission deja reussie.

// Au-dela de 24h la cascade en paliers de 20s n'a pas de sens (memes seuils que
// le web) : la marketplace planifiee prend le relais pour ces missions lointaines.
const DISPATCH_HORIZON_MAX_HOURS = 24;

export function triggerDispatchMission(missionId: string, scheduledAt: string): void {
  const horizonHours = (new Date(scheduledAt).getTime() - Date.now()) / 3_600_000;
  if (horizonHours > DISPATCH_HORIZON_MAX_HOURS) return;

  const supabase = getSupabaseClient();
  void supabase.functions
    .invoke('dispatch_mission', { body: { mission_id: missionId } })
    .then(({ error }) => {
      if (error) console.warn('[dispatchTrigger] invoke dispatch_mission failed', error);
    })
    .catch((err) => console.warn('[dispatchTrigger] fire-and-forget threw', err));
}
