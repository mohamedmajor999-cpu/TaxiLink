'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { computeRoute, computeRouteGoogle } from '@/services/addressService'

interface Coords { lat: number; lng: number }

interface UseMissionRouteArgs {
  initialDeparture?: Coords | null
  initialDestination?: Coords | null
  initialDistanceKm?: number | null
  initialDurationMin?: number | null
  /** ISO date — utilisée pour prédire le trafic via Google Routes. */
  scheduledAt?: string | null
}

export function useMissionRoute(args: UseMissionRouteArgs = {}) {
  const [departureCoords, setDepartureCoordsState] = useState<Coords | null>(args.initialDeparture ?? null)
  const [destinationCoords, setDestinationCoordsState] = useState<Coords | null>(args.initialDestination ?? null)
  const [distanceKm, setDistanceKm] = useState<number | null>(args.initialDistanceKm ?? null)
  const [durationMin, setDurationMin] = useState<number | null>(args.initialDurationMin ?? null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setDepartureCoords = useCallback((c: Coords | null) => {
    setDepartureCoordsState(c)
    setDistanceKm(null)
    setDurationMin(null)
    setRouteError(null)
  }, [])

  const setDestinationCoords = useCallback((c: Coords | null) => {
    setDestinationCoordsState(c)
    setDistanceKm(null)
    setDurationMin(null)
    setRouteError(null)
  }, [])

  useEffect(() => () => {
    abortRef.current?.abort()
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  // Debounce 400ms : remplissage vocal met à jour coords puis date/heure en rafale.
  // On attend la stabilisation avant un SEUL appel Routes avec la date finale.
  useEffect(() => {
    if (!departureCoords || !destinationCoords) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLoadingRoute(true)
    setRouteError(null)

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      computeRouteGoogle(departureCoords, destinationCoords, ctrl.signal, args.scheduledAt ?? null)
        .then(async (google) => {
          if (google) return google
          return computeRoute(departureCoords, destinationCoords, ctrl.signal)
        })
        .then((res) => {
          if (ctrl.signal.aborted) return
          setDistanceKm(res.distance_km)
          setDurationMin(res.duration_min)
        })
        .catch((err) => {
          if ((err as Error).name === 'AbortError') return
          setDistanceKm(null)
          setDurationMin(null)
          setRouteError(err instanceof Error ? err.message : "Échec du calcul d'itinéraire")
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoadingRoute(false)
        })
    }, 400)
  }, [departureCoords, destinationCoords, args.scheduledAt])

  return {
    departureCoords,
    destinationCoords,
    distanceKm,
    durationMin,
    loadingRoute,
    routeError,
    setDepartureCoords,
    setDestinationCoords,
  }
}
