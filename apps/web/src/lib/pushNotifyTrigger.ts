// Declenche l'Edge Function `notify_drivers_new_mission` apres creation d'une
// mission. Envoie une push (Expo -> FCM/APNs) a tous les chauffeurs du dept
// qui n'ont pas desactive popupNewMission. Fire-and-forget, ne bloque pas la
// reponse de /api/missions.

export function triggerPushNotifyNewMission(missionId: string): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('[pushNotifyTrigger] SUPABASE_URL/SERVICE_ROLE_KEY manquant — push skipped')
    return
  }

  fetch(`${url}/functions/v1/notify_drivers_new_mission`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mission_id: missionId }),
  }).catch((err) => {
    console.error('[pushNotifyTrigger] fire-and-forget failed', err)
  })
}
