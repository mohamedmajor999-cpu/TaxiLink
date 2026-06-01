import { useEffect, useRef } from 'react';
import type { Mission } from '@taxilink/supabase-types';
import { useGpsStore } from '@taxilink/stores';

// Rayons (m) du cercle de detection autour du point cible. Web utilise les
// memes valeurs : 80m pickup (plus serre, on cherche le bon batiment) et
// 100m destination (plus large, l'hopital fait souvent > 50m).
const PICKUP_RADIUS_M = 80;
const DROP_RADIUS_M = 100;

// Duree (ms) de "dwell" : il faut etre dans le rayon depuis au moins 2 min
// avant de declencher l'auto-transition. Evite les faux positifs (passage
// rapide devant le point sans s'arreter).
const DWELL_MS = 2 * 60_000;

// Interval (ms) de check. Le GPS store update sur mouvement, mais si le
// chauffeur est immobile (= ce qu'on cherche pour le dwell !) il faut un
// timer separe pour re-evaluer la duree.
const CHECK_INTERVAL_MS = 10_000;

type Step = 'enroute' | 'arrived_pickup' | 'onboard' | 'arrived_dest' | 'dropped' | 'done';

interface Options {
  mission: Mission | null;
  step: Step | null;
  /** Callback lance quand le chauffeur a dwell suffisamment sur la cible. */
  onAutoAdvance: (target: 'pickup' | 'dropoff') => void;
}

// Hook geofence : declenche auto une transition d'etape quand le chauffeur
// est physiquement sur place depuis assez longtemps. Cible determinee par
// `step` :
//   - enroute → cible = pickup (radius 80m)
//   - onboard → cible = destination (radius 100m)
//   - autres steps → desactive (pas de geofence sur les transitions humaines
//     "patient a bord" / "patient depose")
//
// Les boutons manuels restent toujours dispos en parallele : si le GPS rate
// (precision faible, batterie eco, etc.) le chauffeur peut toujours tap.
export function useGeofenceProgress({ mission, step, onAutoAdvance }: Options) {
  const coords = useGpsStore((s) => s.coords);
  // Timestamp d'entree dans le rayon. Reset si on sort, ou si on change de step.
  const entryAtRef = useRef<number | null>(null);
  const advancedRef = useRef<string | null>(null); // step+missionId deja transitionne

  useEffect(() => {
    // Reset le tracker quand le contexte change (autre mission ou autre step).
    entryAtRef.current = null;
  }, [mission?.id, step]);

  useEffect(() => {
    if (!mission || !step || !coords) return;

    const target = pickTarget(mission, step);
    if (!target) return;

    // Anti-double-trigger : si on a deja transitionne ce step, ignore.
    const stepKey = `${mission.id}:${step}`;
    if (advancedRef.current === stepKey) return;

    function check() {
      const c = useGpsStore.getState().coords;
      if (!c) return;
      const distance = haversineMeters(c.lat, c.lng, target!.lat, target!.lng);
      if (distance <= target!.radius) {
        if (entryAtRef.current === null) {
          entryAtRef.current = Date.now();
        } else if (Date.now() - entryAtRef.current >= DWELL_MS) {
          advancedRef.current = stepKey;
          entryAtRef.current = null;
          onAutoAdvance(target!.kind);
        }
      } else {
        // Sortie du rayon → reset le dwell.
        entryAtRef.current = null;
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
    // coords.lat/lng dans les deps pour re-check immediat au mouvement (en plus
    // du timer). Le timer couvre le cas immobile, le mouvement couvre le cas
    // "arrivee fraiche".
  }, [mission?.id, step, coords?.lat, coords?.lng, onAutoAdvance]);
}

function pickTarget(
  m: Mission,
  step: Step,
): { lat: number; lng: number; radius: number; kind: 'pickup' | 'dropoff' } | null {
  if (step === 'enroute' && m.departure_lat != null && m.departure_lng != null) {
    return { lat: m.departure_lat, lng: m.departure_lng, radius: PICKUP_RADIUS_M, kind: 'pickup' };
  }
  if (step === 'onboard' && m.destination_lat != null && m.destination_lng != null) {
    return { lat: m.destination_lat, lng: m.destination_lng, radius: DROP_RADIUS_M, kind: 'dropoff' };
  }
  return null;
}

// Distance ortho entre 2 points GPS (formule de Haversine). Retourne metres.
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
