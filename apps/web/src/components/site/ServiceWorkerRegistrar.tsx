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
    navigator.serviceWorker.register('/sw.js').catch(() => { /* noop */ })
  }, [])
  return null
}
