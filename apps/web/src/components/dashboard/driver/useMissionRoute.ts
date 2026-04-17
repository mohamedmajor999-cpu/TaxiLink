'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { computeRoute } from '@/services/addressService'

interface Coords { lat: number; lng: number }

interface UseMissionRouteArgs {
  initialDeparture?: Coords | null
  initialDestination?: Coords | null
  initialDistanceKm?: number | null
  initialDurationMin?: number | null
}

export function useMissionRoute(args: UseMissionRouteArgs = {}) {
  const [departureCoords, setDepartureCoordsState] = useState<Coords | null>(args.initialDeparture ?? null)
  const [destinationCoords, setDestinationCoordsState] = useState<Coords | null>(args.initialDestination ?? null)
  const [distanceKm, setDistanceKm] = useState<number | null>(args.initialDistanceKm ?? null)
  const [durationMin, setDurationMin] = useState<number | null>(args.initialDurationMin ?? null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  // Quand l'utilisateur change manuellement (via setter ci-dessous), on reset les valeurs calculées.
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

  // Cleanup à l'unmount
  useEffect(() => () => abortRef.current?.abort(), [])

  // Déclenche le calcul OSRM dès que les 2 coords sont disponibles
  useEffect(() => {
    if (!departureCoords || !destinationCoords) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoadingRoute(true)
    setRouteError(null)

    computeRoute(departureCoords, destinationCoords, ctrl.signal)
      .then((res) => {
        if (ctrl.signal.aborted) return
        setDistanceKm(res.distance_km)
        setDurationMin(res.duration_min)
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return
        // Non bloquant : on conserve les coords mais on remonte l'erreur pour info
        setDistanceKm(null)
        setDurationMin(null)
        setRouteError(err instanceof Error ? err.message : "Échec du calcul d'itinéraire")
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoadingRoute(false)
      })
  }, [departureCoords, destinationCoords])

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
