import { getSupabaseClient } from '@taxilink/services';

// Backoff exponentiel : 1s, 3s, 8s. Le caller est fire-and-forget donc on
// peut se permettre d'attendre — l'acceptation a deja reussi cote app, on
// essaie juste de notifier le poster. Si le chauffeur a un reseau pourri,
// au moins UN des trois retries devrait passer dans les 12 prochaines
// secondes.
const RETRY_DELAYS_MS = [1_000, 3_000, 8_000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function invokeWithRetry(missionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const { error } = await supabase.functions.invoke('notify_poster_mission_accepted', {
        body: { mission_id: missionId },
      });
      if (!error) return;
      lastErr = error;
    } catch (err) {
      lastErr = err;
    }
    if (attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]!);
    }
  }
  console.warn('[pushNotifyTrigger] all retries failed', lastErr);
}

// Fire-and-forget : appelle l'edge function notify_poster_mission_accepted
// apres qu'un chauffeur ait accepte une annonce postee par un autre chauffeur.
// L'edge function envoie une push Expo au poster (shared_by) qui voit
// "<driver> a pris ta course <depart> -> <destination>" sur son tel.
//
// Retry 3x avec backoff (1s, 3s, 8s) : si le reseau du chauffeur est lent ou
// intermittent au moment de l'accept, l'invoke peut echouer silencieusement
// et le poster ne recoit JAMAIS la notif. Le retry rattrape ces cas.
export function triggerPushNotifyMissionAccepted(missionId: string): void {
  void invokeWithRetry(missionId);
}
