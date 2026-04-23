'use client'

import { useCallback, useEffect, useRef } from 'react'

interface WakeLockSentinel {
  readonly released: boolean
  release: () => Promise<void>
  addEventListener: (event: 'release', handler: () => void) => void
}

interface WakeLockAPI {
  request: (type: 'screen') => Promise<WakeLockSentinel>
}

function getWakeLock(): WakeLockAPI | null {
  if (typeof navigator === 'undefined') return null
  const wl = (navigator as Navigator & { wakeLock?: WakeLockAPI }).wakeLock
  return wl ?? null
}

/**
 * Maintient l'écran allumé tant que le lock est acquis (API native Screen Wake Lock).
 * Le navigateur relâche automatiquement le sentinel quand la page devient cachée :
 * on le ré-acquiert au retour de l'onglet si l'utilisateur le veut toujours.
 * No-op silencieux si l'API n'est pas supportée (iOS < 16.4, Firefox).
 */
export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const wantedRef = useRef(false)

  const acquire = useCallback(async () => {
    wantedRef.current = true
    const api = getWakeLock()
    if (!api || sentinelRef.current) return
    try {
      const sentinel = await api.request('screen')
      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) sentinelRef.current = null
      })
      sentinelRef.current = sentinel
    } catch {
      /* permission refusée ou onglet caché : no-op */
    }
  }, [])

  const release = useCallback(async () => {
    wantedRef.current = false
    const s = sentinelRef.current
    sentinelRef.current = null
    if (!s) return
    try { await s.release() } catch { /* noop */ }
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && wantedRef.current && !sentinelRef.current) {
        void acquire()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      void release()
    }
  }, [acquire, release])

  return { acquire, release }
}
