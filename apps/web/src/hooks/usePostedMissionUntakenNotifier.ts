'use client'

import { useEffect } from 'react'
import { useAuth } from './useAuth'
import { untakenMissionService } from '@/services/untakenMissionService'
import { usePostedUntakenStore } from '@/store/postedUntakenStore'

const POLL_INTERVAL_MS = 30_000

/**
 * Polling 30s : détecte les missions postées par l'user qui n'ont pas trouvé
 * preneur (cf. untakenMissionService.getStuck) et alimente le store
 * postedUntakenStore. Le toast PostedMissionUntakenPopup en consomme.
 *
 * Polling plutôt que realtime car la détection est croisée (missions +
 * mission_offers) et l'horizon "stuck" se déplace avec le temps — un poll
 * périodique réévalue proprement.
 */
export function usePostedMissionUntakenNotifier() {
  const { user } = useAuth()
  const add = usePostedUntakenStore((s) => s.add)

  // Pas de reset() ici : le store persiste `dismissed` en sessionStorage et
  // bloque deja les re-injections via add(). Reset au logout uniquement, dans
  // le handler signOut.
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    const tick = async () => {
      try {
        const stuck = await untakenMissionService.getStuck(user.id)
        if (cancelled) return
        for (const m of stuck) add(m)
      } catch { /* best-effort silencieux */ }
    }
    tick()
    const id = setInterval(tick, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [user?.id, add])
}
