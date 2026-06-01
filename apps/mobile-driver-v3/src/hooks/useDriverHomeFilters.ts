import { useCallback, useMemo, useState } from 'react';
import type { Mission } from '@taxilink/supabase-types';

import { type HomeTypeFilter } from '@/components/missions/homeFilterTypes';
import { type DateFilter } from '@/components/missions/FiltersSheet';
import { haversineKm } from '@/lib/geo';
import { URGENT_FILTER_MIN } from '@/lib/missionFilters';
import { useBackgroundAwareInterval } from './useBackgroundAwareInterval';

interface Params {
  missions: Mission[];
  userCoords: { lat: number; lng: number } | null;
}

// Seuil "Urgent" pour le filtre chip : courses qui démarrent dans ≤ 2h.
// NB : le badge visuel "Urgent" sur les pins/items utilise URGENT_THRESHOLD_MIN
// (10min) dans index.tsx — c'est volontairement plus serré pour le badge
// (rouge éclair) que pour le filtre (qui doit ouvrir plus large).
// Version simplifiée du hook web (apps/web/.../useDriverHomeFilters.ts) :
// type (ALL/CPAM/PRIVE), urgent (≤2h), nearby (<5km). Tri par scheduled_at
// croissant. Pas de tri configurable ni de filtre groupes pour cette étape.
export function useDriverHomeFilters({ missions, userCoords }: Params) {
  const [filter, setFilter] = useState<HomeTypeFilter>('ALL');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [now, setNow] = useState(() => Date.now());

  // Tick UI 30s pour recalculer "Urgent dans Xmin". Pause auto en background
  // (ecran eteint = personne ne lit cette donnee, gain batterie direct).
  const tick = useCallback(() => setNow(Date.now()), []);
  useBackgroundAwareInterval(tick, 30_000);

  const live = useMemo(
    () => missions.filter((m) => m.scheduled_at && new Date(m.scheduled_at).getTime() > now),
    [missions, now],
  );

  const counts = useMemo(() => {
    const c: Record<HomeTypeFilter, number> = { ALL: live.length, CPAM: 0, PRIVE: 0 };
    for (const m of live) {
      if (m.type === 'CPAM') c.CPAM++;
      else if (m.type === 'PRIVE') c.PRIVE++;
    }
    return c;
  }, [live]);

  const filtered = useMemo(() => {
    let list = live;
    if (filter !== 'ALL') list = list.filter((m) => m.type === filter);
    if (urgentOnly) {
      list = list.filter(
        (m) => m.scheduled_at && (new Date(m.scheduled_at).getTime() - now) / 60_000 <= URGENT_FILTER_MIN,
      );
    }
    if (nearbyOnly && userCoords) {
      list = list.filter((m) => {
        if (m.departure_lat == null || m.departure_lng == null) return false;
        return haversineKm(userCoords, { lat: m.departure_lat, lng: m.departure_lng }) <= 5;
      });
    }
    if (dateFilter !== 'all') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      if (dateFilter === 'tomorrow') start.setDate(start.getDate() + 1);
      const startMs = start.getTime();
      const endMs = startMs + 86_400_000;
      list = list.filter((m) => {
        if (!m.scheduled_at) return false;
        const t = new Date(m.scheduled_at).getTime();
        return t >= startMs && t < endMs;
      });
    }
    return [...list].sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return ta - tb;
    });
  }, [live, filter, urgentOnly, nearbyOnly, dateFilter, userCoords, now]);

  return {
    filter,
    setFilter,
    urgentOnly,
    setUrgentOnly,
    nearbyOnly,
    setNearbyOnly,
    dateFilter,
    setDateFilter,
    filteredMissions: filtered,
    counts,
  };
}
