import { useEffect, useState } from 'react';
import type { Mission } from '@taxilink/supabase-types';
import { useGpsStore } from '@taxilink/stores';

export type UrgencyState = 'normal' | 'onsite' | 'late_far' | 'forgotten';

export interface UrgencyInfo {
  state: UrgencyState;
  /** Minutes de retard par rapport à scheduled_at. Négatif si en avance. */
  minutesLate: number;
  /** Distance GPS au point de départ, en metres. Null si GPS ou coords absents. */
  distanceM: number | null;
  /** ETA estimé jusqu'au pickup en minutes, base ~40 km/h urbain. */
  etaMin: number | null;
}

// Seuils et rayons pour la détection d'urgence sur la carte « Prochaine course ».
// - ONSITE_RADIUS_M : génereux pour absorber un parking 50-100m plus loin.
// - FAR_RADIUS_M    : au-dela, le chauffeur n'a clairement pas atteint le pickup.
// - NEAR_TIME_WINDOW_MIN : fenetre temporelle ou "sur place + heure prevue"
//   declenche le coup de pouce "tape Demarrer" (avant ou apres l'heure).
// - FORGOTTEN_MINUTES : retard a partir duquel on parle d'oubli probable.
const ONSITE_RADIUS_M = 200;
const FAR_RADIUS_M = 500;
const NEAR_TIME_WINDOW_MIN = 15;
const FORGOTTEN_MINUTES = 30;
const TICK_MS = 30_000;
const AVG_URBAN_MIN_PER_KM = 1.5;

// Hook qui croise heure prevue + position GPS pour determiner l'urgence
// d'action sur la carte « Prochaine course » (page Aujourd'hui).
//   - normal     : tout va bien, encore du temps
//   - onsite     : sur place (<200m) et dans ±15 min → "tape Demarrer"
//   - late_far   : heure depassee et loin (>500m) → propose nav + appel
//   - forgotten  : retard ≥ 30 min sans approche du pickup → "oubli ?"
// Retourne null si la mission n'a pas de scheduled_at.
export function useNextCourseUrgency(mission: Mission | null): UrgencyInfo | null {
  const coords = useGpsStore((s) => s.coords);
  const [, tick] = useState(0);

  // Force re-render periodique. Le temps avance mais le mission object reste
  // fige entre 2 fetches → sans ce tick, minutesLate ne bouge jamais.
  useEffect(() => {
    if (!mission?.scheduled_at) return;
    const id = setInterval(() => tick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [mission?.scheduled_at]);

  if (!mission?.scheduled_at) return null;

  const scheduledMs = new Date(mission.scheduled_at).getTime();
  const minutesLate = Math.round((Date.now() - scheduledMs) / 60_000);

  const distanceM =
    coords && mission.departure_lat != null && mission.departure_lng != null
      ? haversineMeters(coords.lat, coords.lng, mission.departure_lat, mission.departure_lng)
      : null;

  const etaMin =
    distanceM != null ? Math.max(1, Math.round((distanceM / 1000) * AVG_URBAN_MIN_PER_KM)) : null;

  return { state: pickState(minutesLate, distanceM), minutesLate, distanceM, etaMin };
}

function pickState(minutesLate: number, distanceM: number | null): UrgencyState {
  // Sur place + dans la fenetre temporelle → priorite au "tape Demarrer".
  if (
    distanceM != null &&
    distanceM <= ONSITE_RADIUS_M &&
    Math.abs(minutesLate) <= NEAR_TIME_WINDOW_MIN
  ) {
    return 'onsite';
  }
  // Retard significatif sans approche → oubli probable.
  if (minutesLate >= FORGOTTEN_MINUTES && (distanceM == null || distanceM >= FAR_RADIUS_M)) {
    return 'forgotten';
  }
  // Heure depassee, chauffeur encore loin → escalade soft.
  if (minutesLate > 0 && (distanceM == null || distanceM >= FAR_RADIUS_M)) {
    return 'late_far';
  }
  return 'normal';
}

// Distance ortho entre 2 points GPS (Haversine), en metres. Duplicate des 8
// lignes equivalentes dans useGeofenceProgress — on extrait a la 3e utilisation
// (regle des 3 du CLAUDE.md), pas avant.
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
