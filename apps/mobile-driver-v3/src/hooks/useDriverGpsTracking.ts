import { useEffect, useRef } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useGpsStore } from '@taxilink/stores';

interface Options {
  // Preference RGPD "Partager ma position en ligne" (cf. useGeolocPref).
  // Quand false : on n'enregistre AUCUNE position (pas de permission, pas
  // d'ecoute) et on purge le store pour ne pas exposer une coord obsolete
  // aux ecrans qui font du tri proximite.
  enabled: boolean;
}

// Intervalle de polling du cache OS quand le background tracking est actif.
// `getLastKnownPositionAsync` lit le cache rempli par le foregroundService
// (et par n'importe quel autre consommateur sur le tel) — pas de radio GPS
// rallumee, conso negligeable. 4s = bon compromis : le foregroundService
// pousse un fix toutes les 8s en idle/foreground, 4s de poll assure que la
// carte du chauffeur prenne le fix dans la seconde qui suit son arrivee au
// cache (vs 10s avant qui creait une latence visible cote chauffeur).
const CACHE_POLL_MS = 4_000;

// Hook GPS du dashboard chauffeur — alimente useGpsStore.
//
// Deux modes selon `isBackgroundActive` (true = foregroundService de
// useDriverOnlineTracking tourne, donc une radio GPS deja allumee) :
//
//   - background actif → polling 10s du cache OS via getLastKnownPositionAsync.
//     Pas de watchPositionAsync : on evite que DEUX radios GPS tournent en
//     parallele (la cause #1 de conso batterie identifiee le 2026-05-18).
//
//   - background inactif (chauffeur offline) → watchPositionAsync 5s/20m
//     comme avant : c'est la seule source de position pour la carte.
//
// Anti-jitter : on rejette les lectures sensiblement moins precises (mirror
// PWA useGlobalDriverGps).
export function useDriverGpsTracking({ enabled }: Options): void {
  const setCoords = useGpsStore((s) => s.setCoords);
  const isBackgroundActive = useGpsStore((s) => s.isBackgroundActive);
  const lastAccuracyRef = useRef<number | null>(null);
  const lastPublishedRef = useRef<{ lat: number; lng: number } | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const cachePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCoords(null, null);
      lastAccuracyRef.current = null;
      lastPublishedRef.current = null;
      return;
    }

    let cancelled = false;

    function publish(lat: number, lng: number, accuracy: number | null): void {
      const prev = lastAccuracyRef.current;
      if (accuracy != null && prev != null && accuracy > prev * 2 && accuracy > 30) {
        return;
      }
      // Gate distance : skip si nouveau fix < 5m du precedent. A l'arret, le
      // GPS jitter renvoie des coords legerement differentes toutes les 5s, ce
      // qui declenchait un setState qui cascadait des re-renders Mapbox +
      // home + carousel (240-700 re-renders/h). Maintenant, on ne propage que
      // les mouvements reels. 5m = compromis : assez fin pour suivre une marche
      // lente, assez grand pour absorber le jitter typique 1-3m.
      const last = lastPublishedRef.current;
      if (last) {
        const dLat = (lat - last.lat) * 111320;
        const dLng = (lng - last.lng) * 111320 * Math.cos((lat * Math.PI) / 180);
        const distanceM = Math.sqrt(dLat * dLat + dLng * dLng);
        if (distanceM < 5) return;
      }
      lastPublishedRef.current = { lat, lng };
      if (accuracy != null) lastAccuracyRef.current = accuracy;
      setCoords({ lat, lng }, accuracy);
    }

    async function readCache(): Promise<void> {
      try {
        const cached = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
        if (cancelled || !cached) return;
        publish(cached.coords.latitude, cached.coords.longitude, cached.coords.accuracy);
      } catch {
        // pas critique
      }
    }

    (async () => {
      await readCache();

      // Si les Location services sont desactives au niveau OS, expo-location
      // throw silencieusement plus tard. On verifie d'abord — gain visibilite.
      const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!servicesEnabled) {
        Alert.alert(
          'Localisation désactivée',
          Platform.OS === 'android'
            ? 'Active la localisation dans les réglages Android pour recevoir des courses.'
            : 'Active les services de localisation dans Réglages > Confidentialité.',
          [
            { text: 'Plus tard', style: 'cancel' },
            { text: 'Ouvrir', onPress: () => Linking.openSettings().catch(() => {}) },
          ],
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        // Avant : return silencieux. Sur Pixel 10 Pro la popup permission
        // peut etre auto-refusee sans feedback visible — le chauffeur ne
        // comprend pas pourquoi sa position n'apparait pas. Alert explicite.
        Alert.alert(
          'Localisation refusée',
          'TaxiLink a besoin de ta position pour te montrer les courses près de toi. Active "Toujours autoriser" dans les réglages.',
          [
            { text: 'Plus tard', style: 'cancel' },
            { text: 'Réglages', onPress: () => Linking.openSettings().catch(() => {}) },
          ],
        );
        return;
      }

      if (isBackgroundActive) {
        // Background tracking allume une radio GPS via le foregroundService.
        // On se contente de lire son cache pour alimenter la carte.
        cachePollRef.current = setInterval(readCache, CACHE_POLL_MS);
        return;
      }

      // Pas de background actif → seule source de position : on raffine et
      // on watch.
      try {
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        publish(fresh.coords.latitude, fresh.coords.longitude, fresh.coords.accuracy);
      } catch {
        // timeout possible sur Android froid : watchPosition prendra le relais
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 20, timeInterval: 5000 },
        (loc) => publish(loc.coords.latitude, loc.coords.longitude, loc.coords.accuracy),
      );

      // Filet de securite Pixel : sur certains Pixel 10 Pro avec Android 14,
      // watchPositionAsync ne tire jamais de callback meme avec permission
      // accordee (bug expo-location / Google Play Services). On poll un fix
      // toutes les 15s en parallele pour debloquer la carte.
      cachePollRef.current = setInterval(async () => {
        try {
          const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (cancelled) return;
          publish(fix.coords.latitude, fix.coords.longitude, fix.coords.accuracy);
        } catch {
          // Le watch reste source primaire — un fallback rate ne bloque rien.
        }
      }, 15_000);
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      if (cachePollRef.current) {
        clearInterval(cachePollRef.current);
        cachePollRef.current = null;
      }
    };
  }, [enabled, isBackgroundActive, setCoords]);
}
