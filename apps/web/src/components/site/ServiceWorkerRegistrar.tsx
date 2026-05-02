'use client'

import { useEffect } from 'react'

/**
 * Enregistre /sw.js au chargement. Requis pour que Chrome/Edge/Samsung Internet
 * tirent `beforeinstallprompt` et exposent l'installation PWA en 1 clic.
 * Ne fait rien en dev (pour éviter les caches fantômes au hot-reload).
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    // updateViaCache: 'none' force le navigateur a comparer /sw.js a chaque
    // appel a register/update sans le servir depuis son propre cache HTTP.
    // Couple a un check au focus de l'onglet, on attrape les deploys vite.
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        const triggerUpdate = () => { reg.update().catch(() => { /* noop */ }) }
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') triggerUpdate()
        })
      })
      .catch(() => { /* noop */ })
  }, [])
  return null
}
