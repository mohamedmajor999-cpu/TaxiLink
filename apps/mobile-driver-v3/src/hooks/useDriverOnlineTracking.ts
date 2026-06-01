import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, type AppStateStatus, Linking, Platform } from 'react-native';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { driverService, reportError } from '@taxilink/services';
import { useGpsStore } from '@taxilink/stores';
import { DRIVER_LOCATION_TASK } from '@/tasks/driverLocationTask';
import { useDriverOnlineStore } from '@/lib/driverOnlineStore';
import { subscribeToMotion } from '@/lib/motionDetector';
import {
  type CourseState,
  type TrackingAccuracy,
  type TrackingProfile,
  profileFor,
  profilesEqual,
  notificationBodyFor,
  setStoredCourseState,
} from '@/lib/trackingConfig';

function toExpoAccuracy(a: TrackingAccuracy): Location.LocationAccuracy {
  switch (a) {
    case 'lowest':   return Location.Accuracy.Lowest;
    case 'low':      return Location.Accuracy.Low;
    case 'balanced': return Location.Accuracy.Balanced;
    case 'high':     return Location.Accuracy.High;
  }
}

interface Options {
  isOnline: boolean;
  userId: string | null;
  // Préférence RGPD "Partager ma position en ligne" (cf. useGeolocPref).
  // Si l'utilisateur l'a désactivée on ne démarre pas le tracking background même
  // s'il bascule online — il reste online sans envoyer sa position.
  geolocEnabled: boolean;
  // État de la course chauffeur. Par défaut 'idle'. Permet à la home/screens
  // de courses d'augmenter la fréquence de tracking quand pertinent.
  courseState?: CourseState;
}

// Démarre le suivi GPS background quand le chauffeur passe en ligne, ajuste
// la fréquence en fonction du courseState + batterie + mouvement + AppState,
// et l'arrête quand il repasse hors ligne ou se déconnecte.
//
// V8 HyperSense-style (2026-05-19) :
//   - Motion gate : l'accelerometre detecte stationary 60s+ => GPS passe en
//     mode batched ultra-econome (1 fix / 2 min cell-tower)
//   - AppState gate : app en background + idle => batching renforce
//   - Deferred updates Android : l'OS batch plusieurs reads avant de reveiller
//     le process JS (vrai gain batterie, pas juste moins de pings DB)
//
// Toute la decision est dans profileFor() (pure fn, testable). Ce hook ne fait
// que collecter les signaux (battery / motion / AppState) et restart la task
// Expo Location quand le profil change.
export function useDriverOnlineTracking({
  isOnline,
  userId,
  geolocEnabled,
  courseState = 'idle',
}: Options) {
  const transitioning = useRef(false);
  const appliedProfile = useRef<TrackingProfile | null>(null);
  // Un seul prompt de permission background par session online. Sans ce verrou,
  // sync() est relance a chaque changement de batterie / mouvement / AppState
  // → ensurePermissions() rappele → modal infini tant que la perm n'est pas
  // accordee. Reset quand isOnline repasse false (cf. effet dedie plus bas).
  const permissionAttemptedRef = useRef(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(-1);
  const [isMoving, setIsMoving] = useState<boolean | null>(null);
  const [appBackgrounded, setAppBackgrounded] = useState<boolean>(AppState.currentState !== 'active');
  const setBackgroundActive = useGpsStore((s) => s.setBackgroundActive);

  // Reset du verrou des qu'on quitte le mode online : a la prochaine remise en
  // ligne, on a le droit de re-prompter (l'utilisateur a explicitement re-opte
  // pour le tracking).
  useEffect(() => {
    if (!isOnline) {
      permissionAttemptedRef.current = false;
    }
  }, [isOnline]);

  // === Signal 1 : batterie ===
  useEffect(() => {
    let subscription: Battery.Subscription | null = null;
    (async () => {
      try {
        const initial = await Battery.getBatteryLevelAsync();
        setBatteryLevel(initial);
      } catch {
        // Sur émulateur sans batterie simulée, l'API peut throw — on reste sur -1.
      }
      subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        setBatteryLevel(batteryLevel);
      });
    })();
    return () => {
      subscription?.remove();
    };
  }, []);

  // === Signal 2 : mouvement (accelerometre) ===
  // On ne s'abonne que si le tracking est actif (isOnline + geolocEnabled),
  // pour ne pas faire tourner l'accelerometre quand le user est offline.
  //
  // Pause additionnelle (2026-05-23) : si l'app est en background ET idle,
  // on n'a aucun benefice a polling l'accelero (le profil GPS est deja en
  // mode stationary par defaut). L'accelero qui tournait empechait doze mode
  // Android → reveils JS frequents → chauffe meme ecran eteint. On force
  // isMoving=false (= stationary) qui permet au profil [2] de s'appliquer.
  useEffect(() => {
    if (!isOnline || !geolocEnabled) {
      setIsMoving(null);
      return;
    }
    if (appBackgrounded && courseState === 'idle') {
      setIsMoving(false);
      return;
    }
    const unsubscribe = subscribeToMotion(setIsMoving);
    return unsubscribe;
  }, [isOnline, geolocEnabled, appBackgrounded, courseState]);

  // === Signal 3 : AppState (foreground / background) ===
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      setAppBackgrounded(state !== 'active');
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  // === Persistance courseState pour debug + task background ===
  useEffect(() => {
    setStoredCourseState(courseState).catch(() => {});
  }, [courseState]);

  // === Sync principal : recompute profil + restart task si change ===
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function sync() {
      if (transitioning.current) return;
      transitioning.current = true;
      try {
        const shouldTrack = isOnline && geolocEnabled;
        const alreadyTracking = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => false);

        if (!shouldTrack) {
          if (alreadyTracking) {
            await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
          }
          appliedProfile.current = null;
          setBackgroundActive(false);
          return;
        }

        const desired = profileFor({ courseState, batteryLevel, isMoving, appBackgrounded });

        if (alreadyTracking && profilesEqual(appliedProfile.current, desired)) {
          return;
        }

        if (!alreadyTracking) {
          // Garde-fou : verifier que la task est definie avant start. Si
          // driverLocationTask.ts n'a pas tourne en top-level (rare mais
          // possible avec New Architecture + cold boot Android), defineTask
          // ne s'est pas execute → startLocationUpdatesAsync echoue silencieux.
          const taskDefined = TaskManager.isTaskDefined(DRIVER_LOCATION_TASK);
          if (!taskDefined) {
            reportError(new Error('DRIVER_LOCATION_TASK non definie au moment du start'), {
              tags: { phase: 'gps-tracking-task-undefined' },
            });
            Alert.alert(
              'Erreur GPS',
              'La task GPS n est pas chargee. Ferme et reouvre l app, puis re-active En ligne.',
            );
            return;
          }
          // Cas 1 : modal pas encore affiche cette session → ensurePermissions
          // complet (FG perm + modal explicatif + bg perm request).
          // Cas 2 : deja affiche → on saute le modal mais on re-check la perm
          // au cas ou l'utilisateur l'aurait accordee via Settings entre-temps.
          // Si toujours pas, on exit silencieusement (sans repop le modal).
          //
          // Si permission echoue dans les 2 cas, on flip is_online=false (store
          // + DB) pour eviter l'etat faux "en ligne" : avant le fix, l'app
          // affichait "En ligne" mais aucune position n'etait envoyee. Le
          // chauffeur croyait recevoir des courses, mais le cron offline-after
          // le marquait offline cote DB apres 2 min → personne ne le voyait,
          // 0 offre. Cycle frustrant rapporte 2026-05-24 (audit GPS).
          if (!permissionAttemptedRef.current) {
            permissionAttemptedRef.current = true;
            const ok = await ensurePermissions();
            if (!ok || cancelled) {
              if (!cancelled && userId) await flipOfflineDueToPermissionDenied(userId);
              return;
            }
          } else {
            const fg = await Location.getForegroundPermissionsAsync();
            const bg = await Location.getBackgroundPermissionsAsync();
            if (fg.status !== 'granted' || bg.status !== 'granted') {
              if (userId) await flipOfflineDueToPermissionDenied(userId);
              return;
            }
          }
        }

        // Stop puis start : l'API expo-location ne permet pas de changer
        // l'intervalle d'une task déjà active sans cycle complet.
        if (alreadyTracking) {
          await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
        }
        await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
          accuracy: toExpoAccuracy(desired.accuracy),
          timeInterval: desired.intervalMs,
          distanceInterval: desired.distanceM,
          foregroundService: {
            notificationTitle: 'TaxiLink — En ligne',
            notificationBody: notificationBodyFor(courseState, batteryLevel, isMoving),
            notificationColor: '#FFD23F',
          },
          showsBackgroundLocationIndicator: true,
          // pausesUpdatesAutomatically=FALSE (refonte 2026-05-25) : ne pas
          // laisser iOS suspendre les updates au repos. L'admin doit voir le
          // chauffeur en continu meme quand il est parque ; le precedent
          // true provoquait des "pin disparait quand tel verrouille" rapporte
          // par le user. Trade-off : un peu plus de batterie au repos, mais
          // tracking previsible (cadence 10s constante).
          pausesUpdatesAutomatically: false,
          activityType: Location.ActivityType.AutomotiveNavigation,
          // Android only : si > 0, l'OS batch les reads. Le radio GPS et le
          // process JS restent off jusqu'a ce que l'un des seuils soit atteint
          // (deferredMs OU deferredM). Vrai gain batterie HyperSense-style.
          deferredUpdatesInterval: desired.deferredMs,
          deferredUpdatesDistance: desired.deferredM,
        });

        // Verification post-start : Android 14+ peut "accepter" le start mais
        // refuser de creer le foregroundService si le manifest manque le type.
        // Si la task ne tourne pas reellement, on alerte le user au lieu de
        // laisser un silence trompeur (la home affiche "en ligne" mais le GPS
        // n'envoie rien cote admin).
        const verifyStarted = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => false);
        if (!verifyStarted) {
          const msg = 'startLocationUpdatesAsync a return mais hasStarted=false. Foreground service refuse par Android (manifest type ?).';
          reportError(new Error(msg), { tags: { phase: 'gps-tracking-no-start' } });
          Alert.alert(
            'GPS background non actif',
            'Le suivi de position ne demarre pas. Verifie : Reglages > Apps > TaxiLink > Autorisations > Position = "Toujours autoriser", puis re-bascule "En ligne".',
            [
              { text: 'Plus tard', style: 'cancel' },
              { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings().catch(() => {}) },
            ],
          );
          return;
        }
        appliedProfile.current = desired;
        setBackgroundActive(true);
      } catch (err) {
        // Surface l'erreur au user + Sentry : avant on faisait juste un
        // console.warn invisible en prod, l'utilisateur restait avec un GPS
        // mort sans le savoir. Pour qu'il puisse rapporter le vrai message.
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn('[useDriverOnlineTracking] sync echoue', err);
        reportError(err, { tags: { phase: 'gps-tracking-sync-failed' } });
        Alert.alert(
          'Erreur GPS background',
          `Le tracking n'a pas pu demarrer.\n\nDetail : ${errMsg}\n\nFais une capture d'ecran pour le support.`,
        );
      } finally {
        transitioning.current = false;
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [isOnline, userId, geolocEnabled, courseState, batteryLevel, isMoving, appBackgrounded]);

  // Cleanup ultime au démontage : arrête le foregroundService pour ne pas
  // continuer à pinger Supabase avec une session potentiellement invalide.
  useEffect(() => {
    return () => {
      Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK)
        .then((started) => (started ? Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK) : null))
        .catch(() => {});
      setBackgroundActive(false);
    };
  }, [setBackgroundActive]);
}

// Bascule le chauffeur offline cote store + cote DB quand la permission GPS
// background est refusee. Evite l'etat "en ligne en apparence mais invisible
// cote admin" qui frustre les chauffeurs. Best-effort silencieux : si le RPC
// DB echoue, le cron offline-after (TTL 120s) prendra le relais.
async function flipOfflineDueToPermissionDenied(userId: string): Promise<void> {
  try {
    useDriverOnlineStore.getState().setIsOnline(false);
    await driverService.setOnline(userId, false);
  } catch (err) {
    reportError(err, { tags: { phase: 'gps-permission-denied-flip-offline' } });
  }
}

// Canal dedie pour la notif persistante du foreground service GPS. Sans canal
// explicite Android utilise le canal "Miscellaneous" qui a une importance Low
// (notif silencieuse, facile a manquer) et que l'OEM peut tuer en priorite.
// LOW = pas de son/vibration mais reste visible et le service ne sera pas tue.
//
// IMPORTANT : ce canal doit etre cree AVANT le premier startLocationUpdatesAsync
// pour que la notif de foreground service y soit attachee. Et il ne sera utilise
// que si on passe son ID dans le manifest natif — expo-location utilise son
// propre canal interne par defaut. Ce setup garantit au moins qu'un canal
// approprie existe ET que la permission POST_NOTIFICATIONS est accordee, ce
// qui est la condition pour que la notif s'affiche reellement sur Android 13+.
async function ensureGpsNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('gps-tracking', {
      name: 'Suivi de position GPS',
      importance: Notifications.AndroidImportance.LOW,
      description: 'Notification permanente quand vous etes en ligne, indispensable pour recevoir les courses.',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: false,
      showBadge: false,
    });
  } catch (err) {
    reportError(err, { tags: { phase: 'gps-create-notif-channel' } });
  }
}

async function ensureNotificationPermission(): Promise<boolean> {
  // Sur iOS et Android <= 12, ce check renvoie 'granted' direct. C'est uniquement
  // Android 13+ (API 33) qui exige POST_NOTIFICATIONS. Sans elle, la notif du
  // foreground service est CACHEE → user ne voit rien et croit que ca marche
  // pas, ou Android tue le service au bout de quelques minutes.
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    if (req.status === 'granted') return true;
    Alert.alert(
      'Notifications requises',
      'TaxiLink doit pouvoir afficher une notification permanente quand vous etes en ligne (sans ca le suivi GPS ne fonctionne pas en arriere-plan).\n\nActive les notifications dans : Reglages > Apps > TaxiLink > Notifications.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Ouvrir les reglages', onPress: () => Linking.openSettings().catch(() => {}) },
      ],
    );
    return false;
  } catch (err) {
    reportError(err, { tags: { phase: 'gps-check-notif-permission' } });
    // En cas d'erreur du module, on laisse passer (mieux que de bloquer
    // toute l'app sur une perm secondaire).
    return true;
  }
}

async function ensurePermissions(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    Alert.alert(
      'Localisation requise',
      'Active la localisation pour passer en ligne et recevoir des courses.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings().catch(() => {}) },
      ],
    );
    return false;
  }

  // Skip si la permission background est deja accordee (cas le plus frequent
  // apres l'avoir octroyee une fois).
  const currentBg = await Location.getBackgroundPermissionsAsync();
  if (currentBg.status !== 'granted') {
    // 2026-05-24 — Suppression du pre-prompt BackgroundLocationPrompt modal.
    // L'user reportait qu'il revenait trop souvent ; on appelle directement la
    // demande OS. Si denied, alerte concise + bouton "Ouvrir les reglages".
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      Alert.alert(
        'Localisation en arrière-plan',
        Platform.OS === 'android'
          ? 'Pour rester en ligne quand l\'app est fermee : Reglages > Apps > TaxiLink > Autorisations > Position > "Toujours autoriser".'
          : 'Pour rester en ligne quand l\'app est fermée, choisis "Toujours" dans les réglages de localisation.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings().catch(() => {}) },
        ],
      );
      return false;
    }
  }

  // Cree le canal de notif GPS avant le start. Idempotent : Android merge si
  // deja cree avec le meme ID. Doit etre fait avant la 1ere notif foreground
  // service sinon Android utilise un canal par defaut de basse priorite.
  await ensureGpsNotificationChannel();

  // Android 13+ : sans POST_NOTIFICATIONS la notif foreground service est
  // INVISIBLE et le service tourne en sursis → Android le tue en quelques min.
  const notifOk = await ensureNotificationPermission();
  if (!notifOk) return false;

  return true;
}
