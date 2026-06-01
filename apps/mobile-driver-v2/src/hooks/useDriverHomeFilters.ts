import { useEffect, useMemo, useState } from 'react';
import type { Mission } from '@taxilink/supabase-types';

import { type HomeTypeFilter } from '@/components/missions/DriverHomeFilterChips';

// Distance Haversine entre deux coords lat/lng. ~3 lignes — pas la peine d'importer
// un util cross-platform pour ça en mobile.
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

interface Params {
  missions: Mission[];
  userCoords: { lat: number; lng: number } | null;
}

// Seuil "Urgent" pour le filtre chip : courses qui démarrent dans ≤ 2h.
// NB : le badge visuel "Urgent" sur les pins/items utilise URGENT_THRESHOLD_MIN
// (10min) dans index.tsx — c'est volontairement plus serré pour le badge
// (rouge éclair) que pour le filtre (qui doit ouvrir plus large).
const URGENT_FILTER_MIN = 120;

// Version simplifiée du hook web (apps/web/.../useDriverHomeFilters.ts) :
// type (ALL/CPAM/PRIVE), urgent (≤2h), nearby (<5km). Tri par scheduled_at
// croissant. Pas de tri configurable ni de filtre groupes pour cette étape.
export function useDriverHomeFilters({ missions, userCoords }: Params) {
  const [filter, setFilter] = useState<HomeTypeFilter>('ALL');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

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
    return [...list].sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return ta - tb;
    });
  }, [live, filter, urgentOnly, nearbyOnly, userCoords, now]);

  return {
    filter,
    setFilter,
    urgentOnly,
    setUrgentOnly,
    nearbyOnly,
    setNearbyOnly,
    filteredMissions: filtered,
    counts,
  };
}
