import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { useGpsStore } from '@taxilink/stores';
import { DRIVER_LOCATION_TASK } from '@/tasks/driverLocationTask';
import {
  type CourseState,
  type TrackingAccuracy,
  type TrackingProfile,
  profileFor,
  profilesEqual,
  setStoredCourseState,
} from '@/lib/trackingConfig';

function toExpoAccuracy(a: TrackingAccuracy): Location.LocationAccuracy {
  switch (a) {
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
// la fréquence en fonction du courseState + niveau de batterie, et l'arrête
// quand il repasse hors ligne ou se déconnecte.
//
// Stratégie d'adaptation (cf. profileFor) :
//   - idle           : 15s / 10m
//   - assigned       : 3s  / 5m
//   - in_progress    : 5s  / 10m
//   - batterie < 20% : 30s / 20m (priorité absolue, écrase courseState)
//
// La fenêtre de réveil étant définie côté OS au moment du `startLocationUpdatesAsync`,
// changer de profil = stop+start. On garde une ref `appliedProfile` pour éviter
// de redémarrer si rien n'a changé (le redémarrage coûte ~200ms + 1 popup notif
// transitoire sur Android).
export function useDriverOnlineTracking({
  isOnline,
  userId,
  geolocEnabled,
  courseState = 'idle',
}: Options) {
  const transitioning = useRef(false);
  const appliedProfile = useRef<TrackingProfile | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number>(-1);
  const setBackgroundActive = useGpsStore((s) => s.setBackgroundActive);

  // Abonnement batterie : on n'a besoin d'agir que si le niveau franchit le
  // seuil 20% (passe au profil low-battery ou en sort). Le listener Expo
  // émet à chaque changement de % donc on filtre nous-mêmes.
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

  // Persiste le courseState dans SecureStore pour visibilité/debug et pour
  // éventuel usage futur côté task (adaptation auto-suspend par exemple).
  useEffect(() => {
    setStoredCourseState(courseState).catch(() => {});
  }, [courseState]);

  // Sync principal : compute le profil voulu et restart la task si besoin.
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

        const desired = profileFor({ courseState, batteryLevel });

        if (alreadyTracking && profilesEqual(appliedProfile.current, desired)) {
          // Rien à changer : déjà le bon profil actif.
          return;
        }

        if (!alreadyTracking) {
          const ok = await ensurePermissions();
          if (!ok || cancelled) return;
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
            notificationBody: notificationBodyFor(courseState, batteryLevel),
            notificationColor: '#FFD23F',
          },
          showsBackgroundLocationIndicator: true,
          // iOS : laisse l'OS suspendre les updates quand le tel ne bouge plus
          // (ex : chauffeur en attente). Reprend automatiquement au mouvement.
          // Gain batterie significatif sur les longues attentes.
          pausesUpdatesAutomatically: true,
          activityType: Location.ActivityType.AutomotiveNavigation,
          // 0 = livraison immediate. On peut tolerer un peu de batching pour
          // les profils long (15s idle, 30s low-battery) mais en mode assigned
          // (8s) on prefere garder zero pour la reactivite ETA pickup.
          deferredUpdatesInterval: 0,
        });
        appliedProfile.current = desired;
        setBackgroundActive(true);
      } catch (err) {
        console.warn('[useDriverOnlineTracking] sync échoué', err);
      } finally {
        transitioning.current = false;
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [isOnline, userId, geolocEnabled, courseState, batteryLevel]);

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

function notificationBodyFor(courseState: CourseState, batteryLevel: number): string {
  if (batteryLevel >= 0 && batteryLevel < 0.2) {
    return 'Position partagée (mode économie batterie).';
  }
  if (courseState === 'assigned') return 'En route vers votre client.';
  if (courseState === 'in_progress') return 'Course en cours.';
  return 'Votre position est partagée pour recevoir des courses.';
}

async function ensurePermissions(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    Alert.alert(
      'Localisation requise',
      'Active la localisation pour passer en ligne et recevoir des courses.',
      [{ text: 'OK' }],
    );
    return false;
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    Alert.alert(
      'Localisation en arrière-plan',
      Platform.OS === 'android'
        ? 'Pour rester en ligne quand l\'app est fermée, choisis "Toujours autoriser" dans les réglages de localisation.'
        : 'Pour rester en ligne quand l\'app est fermée, choisis "Toujours" dans les réglages de localisation.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings().catch(() => {}) },
      ],
    );
    return false;
  }
  return true;
}
