// Itinéraires : Google Routes API (trafic prédit) avec fallback OSRM.
// Cache 7j par heure de départ : un même trajet rejoué dans la même heure
// évite un appel Google facturé (trafic stable à l'heure).

import { createPersistedLru } from '@/lib/persistedLru'
import { decodePolyline } from '@/lib/decodePolyline'

const GOOGLE_ROUTES_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const OSRM_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving/'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

interface RouteResult {
  distance_km: number
  duration_min: number
  geometry: GeoJSON.LineString | null
}

const cache = createPersistedLru<RouteResult>({
  storageKey: 'taxilink.routesCache.v2',
  maxSize: 100,
  ttlMs: TTL_MS,
})

function hourBucket(iso?: string | null): string {
  const ts = iso ? Date.parse(iso) : NaN
  const d = !Number.isNaN(ts) && ts > Date.now() ? new Date(ts) : new Date()
  return `${d.getUTCFullYear()}${d.getUTCMonth()}${d.getUTCDate()}${d.getUTCHours()}`
}

// 3 décimales ≈ 110m : tolère les micro-variations de géocoding
// (même POI via placeId différents peut donner lat/lng légèrement différents).
function cacheKey(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  departureTime?: string | null,
): string {
  return `${from.lat.toFixed(3)},${from.lng.toFixed(3)}|${to.lat.toFixed(3)},${to.lng.toFixed(3)}|${hourBucket(departureTime)}`
}

/**
 * Itinéraire via Google Routes API avec trafic prédit à `departureTime`.
 * Renvoie null en cas d'erreur → fallback OSRM côté appelant.
 */
export async function computeRouteGoogle(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  signal?: AbortSignal,
  departureTime?: string | null,
): Promise<RouteResult | null> {
  const rKey = cacheKey(from, to, departureTime)
  const cached = cache.get(rKey)
  if (cached) return cached
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!key) return null

  const body: Record<string, unknown> = {
    origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
    destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    languageCode: 'fr',
    regionCode: 'fr',
  }
  if (departureTime) {
    const ts = Date.parse(departureTime)
    if (!Number.isNaN(ts) && ts > Date.now()) {
      body.departureTime = new Date(ts).toISOString()
    }
  }

  let res: Response
  try {
    res = await fetch(GOOGLE_ROUTES_ENDPOINT, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    return null
  }
  if (!res.ok) return null

  const json = (await res.json()) as {
    routes?: { distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string } }[]
  }
  const route = json.routes?.[0]
  const meters = route?.distanceMeters
  const durationStr = route?.duration
  if (typeof meters !== 'number' || !durationStr) return null
  const seconds = Number(durationStr.replace(/s$/, ''))
  if (Number.isNaN(seconds)) return null
  const encoded = route?.polyline?.encodedPolyline
  const geometry: GeoJSON.LineString | null = encoded
    ? { type: 'LineString', coordinates: decodePolyline(encoded) }
    : null
  const result: RouteResult = {
    distance_km: Math.round(meters / 100) / 10,
    duration_min: Math.round(seconds / 60),
    geometry,
  }
  cache.set(rKey, result)
  return result
}

interface OsrmResponse {
  routes?: { distance?: number; duration?: number; geometry?: GeoJSON.LineString }[]
  code?: string
}

/** Itinéraire OSRM (sans trafic), géométrie GeoJSON incluse. Lève si introuvable. */
export async function computeRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<RouteResult> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `${OSRM_ENDPOINT}${coords}?overview=full&geometries=geojson`

  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new Error('Impossible de joindre le service de routage')
  }

  if (!res.ok) throw new Error(`Erreur OSRM ${res.status}`)

  const json = (await res.json()) as OsrmResponse
  const route = json.routes?.[0]
  if (!route || typeof route.distance !== 'number' || typeof route.duration !== 'number') {
    throw new Error('Itinéraire introuvable')
  }

  return {
    distance_km: Math.round(route.distance / 100) / 10,
    duration_min: Math.round(route.duration / 60),
    geometry: route.geometry ?? null,
  }
}
