// Déclenche l'Edge Function `dispatch_mission` après la création d'une mission.
// Fire-and-forget : ne JAMAIS attendre cette promesse. /api/missions doit
// retourner 201 immédiatement ; la cascade (jusqu'à 100s côté Supabase) tourne
// indépendamment du cycle de vie du handler Next.js.
//
// Skip pour horizon > 24h : la marketplace planifiée legacy gère ces missions,
// la cascade en paliers de 20s n'a pas de sens à cet horizon temporel.
//
// Best-effort : un échec n'invalide PAS la création de mission. Erreurs loggées
// pour Sentry mais non remontées au client.

const DISPATCH_HORIZON_MAX_HOURS = 24

export function triggerDispatchMission(missionId: string, scheduledAt: string): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('[dispatchTrigger] SUPABASE_URL/SERVICE_ROLE_KEY manquant — dispatch skipped')
    return
  }

  const horizonHours = (new Date(scheduledAt).getTime() - Date.now()) / 3_600_000
  if (horizonHours > DISPATCH_HORIZON_MAX_HOURS) return

  fetch(`${url}/functions/v1/dispatch_mission`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mission_id: missionId }),
  }).catch((err) => {
    console.error('[dispatchTrigger] fire-and-forget failed', err)
  })
}
