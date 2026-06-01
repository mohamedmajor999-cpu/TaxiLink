import { useCallback, useEffect, useRef, useState } from 'react';
import { computeRoute, computeRouteGoogle } from '@taxilink/services';

export interface Coords { lat: number; lng: number }

interface Args {
  scheduledAt?: string | null;
}

/**
 * Port mobile du hook PWA useMissionRoute. Debounce 400ms : si l'utilisateur
 * modifie les adresses ou la date en rafale (ex. dictée vocale), on attend
 * la stabilisation avant un SEUL appel Google Routes (fallback OSRM).
 */
export function useMissionRoute({ scheduledAt }: Args = {}) {
  const [departureCoords, setDepartureCoordsState] = useState<Coords | null>(null);
  const [destinationCoords, setDestinationCoordsState] = useState<Coords | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [staticDurationMin, setStaticDurationMin] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function resetMeasures() {
    setDistanceKm(null);
    setDurationMin(null);
    setStaticDurationMin(null);
    setRouteError(null);
  }

  const setDepartureCoords = useCallback((c: Coords | null) => {
    setDepartureCoordsState(c);
    resetMeasures();
  }, []);

  const setDestinationCoords = useCallback((c: Coords | null) => {
    setDestinationCoordsState(c);
    resetMeasures();
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    if (!departureCoords || !destinationCoords) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoadingRoute(true);
    setRouteError(null);

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      computeRouteGoogle(departureCoords, destinationCoords, ctrl.signal, scheduledAt ?? null)
        .then(async (google) => google ?? computeRoute(departureCoords, destinationCoords, ctrl.signal))
        .then((res) => {
          if (ctrl.signal.aborted) return;
          setDistanceKm(res.distance_km);
          setDurationMin(res.duration_min);
          setStaticDurationMin(res.static_duration_min ?? null);
        })
        .catch((err) => {
          if ((err as Error).name === 'AbortError') return;
          setDistanceKm(null);
          setDurationMin(null);
          setStaticDurationMin(null);
          setRouteError(err instanceof Error ? err.message : "Échec du calcul d'itinéraire");
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoadingRoute(false);
        });
    }, 400);
  }, [departureCoords, destinationCoords, scheduledAt]);

  return {
    departureCoords, destinationCoords,
    distanceKm, durationMin, staticDurationMin,
    loadingRoute, routeError,
    setDepartureCoords, setDestinationCoords,
  };
}
