'use client'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
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
    const ping = () => {
      driverService.heartbeat(driverId).catch((err) => {
        // best-effort : un echec ponctuel est attendu (offline transitoire).
        // On laisse Sentry deduire les patterns recurrents si problematique.
        Sentry.captureException(err, { tags: { context: 'heartbeat' } })
      })
    }
    ping()
    const id = setInterval(ping, HEARTBEAT_INTERVAL_MS)
    // Ping au retour de focus : Safari iOS / PWA en background peut totalement
    // suspendre setInterval pendant plusieurs minutes. Sans ce ping, le driver
    // apparait offline au cron jusqu'au prochain tick (60s d'invisibilite max
    // sur dispatch). On ping aussi sur 'focus' pour les bureaux desktop.
    const onVisible = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', ping)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', ping)
    }
  }, [driverId, isOnline])
}
