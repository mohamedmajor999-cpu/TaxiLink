'use client'

import { useEffect } from 'react'

/**
 * Enregistre /sw.js au chargement. Requis pour que Chrome/Edge/Samsung Internet
 * tirent `beforeinstallprompt` et exposent l'installation PWA en 1 clic.
 * Ne fait rien en dev (pour éviter les caches fantômes au hot-reload).
 *
 * Auto-update : quand un nouveau SW (deploy) prend le contrôle de l'onglet,
 * on recharge silencieusement la page pour que la PWA installée passe à la
 * nouvelle version sans intervention de l'utilisateur.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    // controllerchange se declenche aussi a la toute premiere installation
    // (pas uniquement aux mises a jour). On retient l'etat initial : si la
    // page n'avait pas de controller au montage, on ignore le 1er event;
    // les suivants signaleront un vrai deploy.
    const hadController = !!navigator.serviceWorker.controller
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return
      if (reloading) return
      reloading = true
      window.location.reload()
    })

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
