import * as Notifications from 'expo-notifications';
import type { Mission } from '@taxilink/supabase-types';

// Notifications locales rappel chauffeur (2026-05-23) :
// Remplace le geofencing auto-advance (supprime). Si le chauffeur oublie de
// cliquer sur les boutons d'etape, l'OS lui envoie une notif :
//   - 5 min apres scheduled_at sans clic "Je demarre" → notif "Demarre ?"
//   - 15 min apres heure de fin estimee sans clic "Termine" → notif "Termine ?"
// Avec actions inline Android : 1 tap depuis la notif → step transitionne.

const CATEGORY_START = 'mission-start-reminder';
const CATEGORY_END = 'mission-end-reminder';

// Action identifiers : utilises par le listener dans usePushRegistration pour
// dispatch vers la bonne mutation Supabase quand le user tap l'action.
export const ACTION_MARK_ENROUTE = 'mark-enroute';
export const ACTION_MARK_COMPLETE = 'mark-complete';
export const ACTION_OPEN_APP = 'open-app';

// Delais (ms) du seuil de declenchement. 5 min apres scheduled_at = marge
// pour finir le precedent client + s'installer dans la voiture. 15 min apres
// fin estimee = marge raisonnable pour trafic / attente patient.
const START_REMINDER_OFFSET_MS = 5 * 60_000;
const END_REMINDER_OFFSET_MS = 15 * 60_000;

// === Setup categories Android au boot (idempotent) ===
let categoriesSetup = false;
export async function setupMissionNotificationCategories(): Promise<void> {
  if (categoriesSetup) return;
  try {
    await Notifications.setNotificationCategoryAsync(CATEGORY_START, [
      {
        identifier: ACTION_MARK_ENROUTE,
        buttonTitle: 'Oui, démarré',
        options: { isAuthenticationRequired: false, opensAppToForeground: false },
      },
      {
        identifier: ACTION_OPEN_APP,
        buttonTitle: 'Ouvrir',
        options: { opensAppToForeground: true },
      },
    ]);
    await Notifications.setNotificationCategoryAsync(CATEGORY_END, [
      {
        identifier: ACTION_MARK_COMPLETE,
        buttonTitle: 'Oui, terminée',
        options: { isAuthenticationRequired: false, opensAppToForeground: false },
      },
      {
        identifier: ACTION_OPEN_APP,
        buttonTitle: 'Ouvrir',
        options: { opensAppToForeground: true },
      },
    ]);
    categoriesSetup = true;
  } catch {
    // expo-notifications peut throw en Expo Go ou si le module natif n'est
    // pas dispo. On laisse passer — les notifs simples marcheront sans actions.
  }
}

// Helper : retourne le scheduledAt+offset en Date, ou null si invalide / passe.
function buildTrigger(scheduledIso: string | null, offsetMs: number): Date | null {
  if (!scheduledIso) return null;
  const scheduled = new Date(scheduledIso).getTime();
  if (!Number.isFinite(scheduled)) return null;
  const triggerAt = scheduled + offsetMs;
  if (triggerAt <= Date.now() + 5_000) return null; // trop tard (deja passe)
  return new Date(triggerAt);
}

// === Schedule notif "as-tu demarre ?" ===
// Renvoie l'identifier de la notif planifiee (ou null si pas schedulable).
// Stocker cet ID dans AsyncStorage `mission_notif_start:${missionId}` pour
// pouvoir cancel plus tard.
export async function scheduleMissionStartReminder(mission: Mission): Promise<string | null> {
  await setupMissionNotificationCategories();
  const trigger = buildTrigger(mission.scheduled_at, START_REMINDER_OFFSET_MS);
  if (!trigger) return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Course ${mission.patient_name ?? ''}`.trim(),
        body: 'Tu as démarré cette course ?',
        categoryIdentifier: CATEGORY_START,
        data: { missionId: mission.id, kind: 'start-reminder' },
        sound: 'default',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger } as Notifications.NotificationTriggerInput,
    });
    return id;
  } catch {
    return null;
  }
}

// === Schedule notif "as-tu termine ?" ===
// Base : scheduled_at + duration_min + END_REMINDER_OFFSET_MS.
// Si duration_min manquant : fallback 60 min (course moyenne).
export async function scheduleMissionEndReminder(mission: Mission): Promise<string | null> {
  await setupMissionNotificationCategories();
  if (!mission.scheduled_at) return null;
  const durationMin = mission.duration_min ?? mission.static_duration_min ?? 60;
  const offsetMs = durationMin * 60_000 + END_REMINDER_OFFSET_MS;
  const trigger = buildTrigger(mission.scheduled_at, offsetMs);
  if (!trigger) return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Course ${mission.patient_name ?? ''}`.trim(),
        body: 'Tu as déposé le patient et terminé la course ?',
        categoryIdentifier: CATEGORY_END,
        data: { missionId: mission.id, kind: 'end-reminder' },
        sound: 'default',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger } as Notifications.NotificationTriggerInput,
    });
    return id;
  } catch {
    return null;
  }
}

// === Cancel par identifier ===
export async function cancelMissionReminder(identifier: string | null | undefined): Promise<void> {
  if (!identifier) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // best-effort
  }
}

// === Cancel toutes les notifs d'une mission (scan + filtre) ===
// Plus robuste qu'un cache d'IDs en AsyncStorage : marche apres app restart,
// pas de fuites si stockage corrompu. Performance : <50ms typique pour <50
// notifs planifiees (n_drivers * 2 notifs).
export async function cancelMissionRemindersForMission(missionId: string): Promise<void> {
  if (!missionId) return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = all.filter((n) => {
      const data = (n.content.data ?? {}) as { missionId?: string };
      return data.missionId === missionId;
    });
    await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})));
  } catch {
    // best-effort
  }
}

// === Cancel uniquement les notifs "start" d'une mission ===
// Utilise au markEnRoute (la course a vraiment demarre, plus besoin de
// rappeler) mais on garde la notif "end".
export async function cancelMissionStartReminder(missionId: string): Promise<void> {
  if (!missionId) return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = all.filter((n) => {
      const data = (n.content.data ?? {}) as { missionId?: string; kind?: string };
      return data.missionId === missionId && data.kind === 'start-reminder';
    });
    await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})));
  } catch {
    // best-effort
  }
}
