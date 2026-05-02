// Service Worker minimal : sa seule raison d'etre est d'activer
// `beforeinstallprompt` (sans SW, Chrome/Edge ne proposent pas l'install
// PWA). On NE cache PAS les bundles JS/CSS — sinon on bloque la diffusion
// des deploys et l'utilisateur reste sur d'anciens bundles. Next.js gere
// deja le cache HTTP via les hash de fichiers.

const CACHE_NAME = 'taxilink-v9-shell'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Strategie : Network only pour tout. Le SW ne se met en travers que pour
// servir la page offline si la navigation echoue (pas de connexion).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.mode !== 'navigate') return

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  )
})
