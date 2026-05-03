import { NextResponse } from 'next/server'

// Identifiant de build injecte dans le SW pour qu'il change a chaque deploy.
// Sans ca, /sw.js servirait toujours le meme contenu et le navigateur ne
// declencherait jamais la sequence install/activate -> les PWA installees
// resteraient sur l'ancienne version. VERCEL_GIT_COMMIT_SHA est expose au
// build par Vercel; en local, fallback sur Date.now() (chaque `npm run build`
// genere un id different).
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ??
  process.env.NEXT_PUBLIC_BUILD_ID ??
  String(Date.now())

const SW = `// Build: ${BUILD_ID}
// Service Worker minimal — pas de cache JS/CSS pour ne pas bloquer les deploys.
// Seule la page offline est mise en cache; tout le reste passe par le reseau.

const CACHE_NAME = 'taxilink-${BUILD_ID}-shell'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.mode !== 'navigate') return
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)))
})
`

export async function GET() {
  return new NextResponse(SW, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  })
}
