import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getSupabaseClient, reportError } from '@taxilink/services';
import { initApp } from '@/lib/init';
import { DRIVER_LOCATION_TASK } from './driverLocationTaskName';

// Re-export pour conserver l'API historique (`import { DRIVER_LOCATION_TASK }
// from '@/tasks/driverLocationTask'`). Le nom vit dans un module neutre pour
// éviter le cycle init ↔ driverLocationTask (cf. driverLocationTaskName.ts).
export { DRIVER_LOCATION_TASK };

interface LocationTaskBody {
  data?: { locations?: Location.LocationObject[] };
  error?: TaskManager.TaskManagerError | null;
}

// IMPORTANT : defineTask doit être appelé au top-level du bundle JS (pas dans un hook),
// pour que la tâche soit enregistrée AVANT que le système réveille le process en background.
// Ce fichier est importé depuis app/_layout.tsx pour cette raison.
//
// La task callback tourne dans un contexte JS isolé : pas de React, pas de hooks, pas de
// state. On recrée un client Supabase à la volée — l'adapter AsyncStorage (cf. lib/supabase.ts ;
// choix délibéré : le keystore SecureStore ~2 Ko perdait les sessions à user_metadata enrichi)
// recharge le refresh token, ce qui donne accès au user.id même app fermée.
TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }: LocationTaskBody) => {
  if (error) {
    console.warn('[driverLocationTask] erreur reçue', error);
    return;
  }
  const locations = data?.locations;
  if (!locations || locations.length === 0) return;

  // Sur Android, plusieurs locations peuvent être batchées ; on garde la plus récente.
  const latest = locations[locations.length - 1];
  if (!latest) return;
  const { latitude, longitude } = latest.coords;

  try {
    // initApp est idempotent (flag `bridged`). Quand le systeme Android reveille
    // le process en background pour cette task, app/_layout.tsx n'a pas
    // forcement tourne → on garantit que le client Supabase singleton est bien
    // injecte avant de l'utiliser. Sinon getSupabaseClient() throw.
    initApp();
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      // Pas de session : l'utilisateur s'est déconnecté entre temps. On ne push rien.
      // Le hook côté React aura déjà appelé stopLocationUpdatesAsync dans ce cas,
      // mais la garde ici évite une 401 si la task tourne encore au moment du logout.
      return;
    }

    // Un seul UPDATE met à jour position + heartbeat → 1 round-trip au lieu de 2.
    // Côté DB : last_seen_at est lu par le cron offline-after-120s (cf. PWA).
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('drivers')
      .update({
        current_lat: latitude,
        current_lng: longitude,
        current_position_updated_at: nowIso,
        last_seen_at: nowIso,
      })
      .eq('id', userId);
    if (updateError) {
      // Supabase ne throw PAS sur erreur DB (RLS, réseau) : sans cette remontée,
      // un tracking mort en background était totalement invisible (cf. audit L-03).
      console.warn('[driverLocationTask] UPDATE position rejeté', updateError);
      reportError(updateError, { tags: { task: 'driver-location', step: 'update' } });
    }
  } catch (err) {
    // Ne JAMAIS throw depuis la task — le système Android tue le foregroundService
    // après quelques crashes successifs. On log et on laisse le prochain tick réessayer.
    console.warn('[driverLocationTask] push position échoué', err);
    reportError(err, { tags: { task: 'driver-location', step: 'exception' } });
  }
});
