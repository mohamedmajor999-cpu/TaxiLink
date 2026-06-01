import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setSupabaseClient,
  setApiBaseUrl,
  setErrorReporter,
  setGoogleProxyClient,
  type GoogleProxyKind,
} from '@taxilink/services';
import {
  setPersistStorage,
  usePostedAcceptStore,
  usePostedUntakenStore,
} from '@taxilink/stores';

import { createMobileSupabaseClient } from './supabase';
import { captureException, initSentry } from './sentry';

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

  bridged = true;
}
