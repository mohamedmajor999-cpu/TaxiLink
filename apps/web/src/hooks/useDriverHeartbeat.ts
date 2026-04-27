'use client'
import { useEffect } from 'react'
import { useDriverStore } from '@/store/driverStore'
import { driverService } from '@/services/driverService'

// TTL associe (cf. groupStatsService) : 120s. On ping toutes les 60s pour
// rester confortablement sous la ligne morte. Ne pas baisser sous 30s sans
// reflechir au cout en requetes Supabase.
const HEARTBEAT_INTERVAL_MS = 60_000

// Pong unique : ne ping que tant que le chauffeur est marque en ligne.
// Quand isOnline passe a false, on degage l'interval. Le useEffect s'occupe
// du cleanup au unmount (logout, navigation hors dashboard).
export function useDriverHeartbeat() {
  const driverId = useDriverStore((s) => s.driver.id)
  const isOnline = useDriverStore((s) => s.driver.isOnline)

  useEffect(() => {
    if (!driverId || !isOnline) return
    // Ping immediat pour rafraichir last_seen_at apres un retour de focus
    // (le tab a pu rester ouvert sans heartbeat pendant la mise en veille).
    driverService.heartbeat(driverId).catch(() => { /* best-effort */ })
    const id = setInterval(() => {
      driverService.heartbeat(driverId).catch(() => { /* best-effort */ })
    }, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(id)
  }, [driverId, isOnline])
}
