'use client'
import { useEffect, useRef } from 'react'
import { useGpsStore } from '@/store/gpsStore'

// Lance un seul watchPosition pour le dashboard et alimente useGpsStore.
// Monté dans DriverDashboard (au-dessus de tous les onglets), il garantit
// que la position est connue quel que soit l'écran courant — le geofence
// d'auto-progression doit fonctionner même sur l'onglet « Aujourd'hui ».
//
// Filtre anti-jitter : rejette les lectures sensiblement moins précises que
// la précédente (ex: bascule GPS → Wi-Fi → +200m d'incertitude soudaine).
export function useGlobalDriverGps() {
  const setCoords = useGpsStore((s) => s.setCoords)
  const lastAccuracyRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newAcc = pos.coords.accuracy
        const prevAcc = lastAccuracyRef.current
        if (prevAcc != null && newAcc > prevAcc * 2 && newAcc > 30) return
        lastAccuracyRef.current = newAcc
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }, newAcc)
      },
      () => { /* permission refusée : auto-progression et tri proximité retombent en mode dégradé */ },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )

    return () => navigator.geolocation.clearWatch(id)
  }, [setCoords])
}
