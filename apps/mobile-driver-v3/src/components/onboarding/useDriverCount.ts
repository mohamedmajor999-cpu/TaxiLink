import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverStatsService } from '@taxilink/services';

// Social proof onboarding : compteur de chauffeurs. Cache 5 min pour eviter
// N requetes au cold-start si l'user revoit l'onboarding plusieurs fois.
// Fallback 147 si RLS bloque ou erreur reseau — pas d'erreur visible.
const CACHE_KEY = 'taxilink.onboarding.driver_count';
const CACHE_TTL_MS = 5 * 60 * 1000;
const FALLBACK = 147;

type Cached = { count: number; ts: number };

export function useDriverCount(dept?: string): number {
  const [count, setCount] = useState<number>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Cached;
          if (Date.now() - parsed.ts < CACHE_TTL_MS && parsed.count > 0) {
            if (!cancelled) setCount(parsed.count);
            return;
          }
        }
      } catch { /* ignore cache miss */ }

      try {
        const fresh = await driverStatsService.getCount(dept);
        if (cancelled) return;
        if (fresh > 0) {
          setCount(fresh);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ count: fresh, ts: Date.now() }));
        }
      } catch { /* fallback already set */ }
    })();

    return () => { cancelled = true; };
  }, [dept]);

  return count;
}
