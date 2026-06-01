import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportError, userPrefsService } from '@taxilink/services';

// Port mobile du hook PWA `apps/web/.../useGroupFavorites.ts`.
// - AsyncStorage = cache local pour affichage instantané au mount (évite le flash "non favori")
// - user_metadata.favorite_group_ids (Supabase) = source de vérité, survit aux uninstalls/changements d'appareil
// - Persistance : à chaque toggle, on écrit AsyncStorage (sync) + on pousse Supabase (best-effort)
//
// Tableau ordonné : le 1er id entré est considéré comme le "primary" (hero card).
const FAV_KEY = 'taxilink:driver:favoriteGroupIds';

async function loadCache(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function persistCache(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {
    /* noop : on tolère un échec d'écriture, le serveur reste la source de vérité */
  }
}

export function useGroupFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) cache local immédiat (UI sans flash)
      const cache = await loadCache();
      if (!cancelled && cache.length > 0) setIds(cache);
      // 2) refresh autoritatif depuis Supabase
      try {
        const server = await userPrefsService.getFavoriteGroupIds();
        if (cancelled) return;
        setIds(server);
        await persistCache(server);
      } catch (err) {
        // Silencieux : on garde le cache si le serveur ne répond pas
        reportError(err, { tags: { phase: 'favorites-fetch' } });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      // Cache local : fire-and-forget
      void persistCache(next);
      // Push serveur en arrière-plan ; un échec laisse le cache local intact
      userPrefsService.updateFavoriteGroupIds(next).catch((err) => {
        reportError(err, { tags: { phase: 'favorites-update' } });
      });
      return next;
    });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const primary = ids[0] ?? null;

  return { ids, has, toggle, primary };
}
