'use client'
import { useEffect } from 'react'
import { useDriverStore } from '@/store/driverStore'

// Ramene la latence de detection "hors ligne" de 120s (TTL heartbeat) a ~0
// quand l'utilisateur ferme volontairement son onglet.
//
// On filtre `event.persisted` : si la page entre en bfcache (switch d'onglet
// browser, switch d'app Android, swipe back iOS), on NE flippe PAS is_online,
// car la page peut revenir au premier plan et le chauffeur n'a rien fait.
// Sans ce filtre, Chrome/Samsung Browser Android decompte le chauffeur offline
// des qu'il quitte l'onglet de l'app, alors que le heartbeat tourne toujours.
//
// On a aussi vire `beforeunload` : pas fiable sur mobile (souvent pas fire),
// et fait double-emploi avec pagehide quand il fire bien.
//
// Ne couvre PAS : crash navigateur, kill -9, perte reseau brutale, mode avion,
// switch d'app long. Ces cas restent rattrapes par le TTL heartbeat (120s).
export function useDriverOfflineBeacon() {
  const driverId = useDriverStore((s) => s.driver.id)
  const isOnline = useDriverStore((s) => s.driver.isOnline)

  useEffect(() => {
    if (!driverId || !isOnline) return
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return

    const fire = (e: PageTransitionEvent) => {
      // bfcache : la page peut revivre, on ne flippe pas is_online.
      if (e.persisted) return
      // Body vide : l'auth se fait via le cookie Supabase porte par le beacon.
      navigator.sendBeacon('/api/driver/offline')
    }

    window.addEventListener('pagehide', fire)
    return () => {
      window.removeEventListener('pagehide', fire)
    }
  }, [driverId, isOnline])
}
