'use client'
import { useEffect } from 'react'
import { useDriverStore } from '@/store/driverStore'

// Ramene la latence de detection "hors ligne" de 120s (TTL heartbeat) a ~0
// quand l'utilisateur ferme volontairement son onglet. Couvre :
// - fermeture d'onglet (beforeunload + pagehide)
// - lock ecran / passage en arriere-plan iOS (pagehide est plus fiable que
//   beforeunload sur Safari mobile)
//
// Ne couvre PAS : crash navigateur, kill -9, perte reseau brutale, mode avion.
// Ces cas restent rattrapes par le TTL heartbeat (120s).
//
// Le beacon est non-bloquant : meme si le serveur ne repond pas, le navigateur
// continue sa fermeture sans attendre.
export function useDriverOfflineBeacon() {
  const driverId = useDriverStore((s) => s.driver.id)
  const isOnline = useDriverStore((s) => s.driver.isOnline)

  useEffect(() => {
    if (!driverId || !isOnline) return
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return

    const fire = () => {
      // Body vide : l'auth se fait via le cookie Supabase porte par le beacon.
      navigator.sendBeacon('/api/driver/offline')
    }

    // pagehide est plus fiable que beforeunload sur Safari mobile (iOS) et
    // sur les navigations bfcache. On ecoute les deux pour couvrir desktop +
    // mobile sans rater de cas.
    window.addEventListener('pagehide', fire)
    window.addEventListener('beforeunload', fire)
    return () => {
      window.removeEventListener('pagehide', fire)
      window.removeEventListener('beforeunload', fire)
    }
  }, [driverId, isOnline])
}
