const CACHE_NAME = 'taxilink-v6'
const OFFLINE_URL = '/offline'

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/brand/icon.svg',
  '/brand/logo-primary.svg',
  '/brand/logo-wordmark.svg',
  '/icons/apple-touch-icon.png',
  '/telecharger',
  '/install',
  '/auth/login',
]

// Installation — précache des assets statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activation — suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Stratégie de fetch
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return

  // Ignorer les API Supabase, les routes API Next.js et les APIs externes (BAN, OSRM)
  const url = new URL(event.request.url)
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.io') ||
    url.hostname === 'api-adresse.data.gouv.fr' ||
    url.hostname === 'router.project-osrm.org' ||
    url.hostname === 'photon.komoot.io' ||
    url.hostname === 'api.mapbox.com' ||
    url.hostname.endsWith('.tile.openstreetmap.org')
  ) return

  // Pages de navigation → Network First avec fallback offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Mise en cache de la page si succès
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // Assets statiques (images, fonts, JS, CSS) → Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})
