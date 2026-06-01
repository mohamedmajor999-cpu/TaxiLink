import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  setSupabaseClient,
  setApiBaseUrl,
  setErrorReporter,
  setGoogleProxyClient,
  type GoogleProxyKind,
} from '@taxilink/services';
import {
  setPersistStorage,
  useGpsStore,
  useNightModeStore,
  usePostedAcceptStore,
  usePostedUntakenStore,
} from '@taxilink/stores';

import { createMobileSupabaseClient } from './supabase';
import { useDriverOnlineStore } from './driverOnlineStore';
import { captureException, initSentry } from './sentry';
import { DRIVER_LOCATION_TASK } from '@/tasks/driverLocationTaskName';

let bridged = false;

export function initApp(): void {
  if (bridged) return;

  initSentry();
  const supabase = createMobileSupabaseClient();
  setSupabaseClient(supabase);

  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://taxilink.fr';
  setApiBaseUrl(apiBase);

  setErrorReporter({ captureException });

  // Branche AsyncStorage comme storage des stores zustand persist (mirror
  // localStorage cote web). Sans cette injection, postedAcceptStore et
  // postedUntakenStore tombent sur le memory store et perdent les dismissed.
  setPersistStorage({
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
  });

  // Re-hydrate les stores depuis AsyncStorage maintenant que le storage est
  // branche. Sans ceci, l'hydration initiale (au load du module @taxilink/
  // stores, AVANT que setPersistStorage soit appele) lit depuis memoryStorage
  // vide → les `dismissed` persistes ne sont jamais charges → les 30 notifs
  // reviennent a chaque demarrage.
  void usePostedAcceptStore.persist.rehydrate();
  void usePostedUntakenStore.persist.rehydrate();
  // useGpsStore persiste les dernieres coords pour centrer la carte au
  // cold-start au lieu d'attendre le premier fix (delai 1-3s en exterieur,
  // jusqu'a 30s indoor). Sans ce rehydrate, la carte demarre vide avec un
  // fallback (dept 13 / Paris) — l'utilisateur voit la mauvaise zone une seconde.
  void useGpsStore.persist.rehydrate();
  // useNightModeStore : sans rehydrate, l'app revenait toujours en mode clair
  // au cold-start meme si l'user avait choisi sombre (la valeur persistee
  // dans AsyncStorage n'etait jamais lue car sharedStorage n'etait pas
  // branche au moment de l'hydration initiale zustand). Bug rapporte 2026-05-23.
  void useNightModeStore.persist.rehydrate();
  // useDriverOnlineStore : permet a l'user de rester en ligne meme apres un
  // force-close (le cron offline-after a pu flip is_online cote DB pendant
  // l'absence ; au cold-start on resync via DriverNotifiersBridge). Sans
  // rehydrate, le store revient toujours a isOnline=false → l'user "perd"
  // son etat en ligne entre deux sessions. Demande user 2026-05-25.
  void useDriverOnlineStore.persist.rehydrate();

  // Plus de clé Google côté mobile : tous les appels Places/Routes passent par
  // l'Edge Function Supabase `google-cache` qui détient la clé serveur et
  // partage un cache Postgres entre tous les drivers. Économie massive à
  // l'échelle (1 appel Google pour N drivers qui tapent la même adresse).
  setGoogleProxyClient(async (kind: GoogleProxyKind, payload: unknown, signal?: AbortSignal) => {
    const { data, error } = await supabase.functions.invoke<{ value: unknown; cached?: boolean }>(
      'google-cache',
      { body: { kind, payload } },
    );
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (error) {
      let msg = error.message || 'Erreur google-cache';
      const ctx = (error as { context?: unknown }).context;
      if (ctx instanceof Response) {
        try {
          const txt = await ctx.text();
          try { const j = JSON.parse(txt); if (j?.error) msg = j.error; } catch { /* ignore */ }
        } catch { /* ignore */ }
      }
      throw new Error(msg);
    }
    return data?.value;
  });

  // Nettoyage de session au logout (audit H-04 / L-10). `isOnline` est persiste
  // sous une cle scoped-DEVICE (`taxilink-driver-online`), pas par user. Sans ce
  // reset, un 2e chauffeur sur un appareil partage serait re-flip "en ligne" +
  // tracke GPS par la reconciliation cold-start de (driver)/_layout.tsx, sans
  // consentement. Un seul listener global ici (initApp idempotent) couvre TOUS
  // les chemins de deconnexion (bouton profil, expiration de session en
  // background). `SIGNED_OUT` ne fire pas au boot sans session (c'est
  // INITIAL_SESSION), donc pas de reset parasite au demarrage.
  supabase.auth.onAuthStateChange((event) => {
    if (event !== 'SIGNED_OUT') return;
    try { useDriverOnlineStore.getState().setIsOnline(false); } catch { /* noop */ }
    try { useDriverOnlineStore.setState({ courseState: 'idle' }); } catch { /* noop */ }
    // Efface la derniere position connue persistee (partialize ne garde que coords).
    try { useGpsStore.getState().setCoords(null, null); } catch { /* noop */ }
    // Coupe le foregroundService GPS s'il tourne encore.
    void Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK)
      .then((started) => (started ? Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK) : null))
      .catch(() => { /* noop */ });
  });

  bridged = true;
}
