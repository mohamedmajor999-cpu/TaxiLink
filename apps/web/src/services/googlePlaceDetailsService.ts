// Google Place Details (New) — résout placeId → coords, avec cache LRU 30j.

import { createPersistedLru } from '@/lib/persistedLru'

const ENDPOINT = 'https://places.googleapis.com/v1/places'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

interface PlaceDetails {
  lat: number
  lng: number
  formattedAddress?: string
}

const cache = createPersistedLru<PlaceDetails>({
  storageKey: 'taxilink.placeDetailsCache.v1',
  maxSize: 300,
  ttlMs: TTL_MS,
})

/**
 * Récupère les coordonnées d'un lieu Google.
 * FieldMask `location` → SKU Essentials (le moins cher).
 * Appelé seulement à la sélection pour éviter des appels inutiles.
 */
export async function resolveGooglePlace(
  placeId: string,
  signal?: AbortSignal,
  sessionToken?: string,
): Promise<PlaceDetails | null> {
  const cached = cache.get(placeId)
  if (cached) return cached
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!key) return null

  const url = sessionToken
    ? `${ENDPOINT}/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`
    : `${ENDPOINT}/${encodeURIComponent(placeId)}`

  let res: Response
  try {
    res = await fetch(url, {
      signal,
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'location,formattedAddress',
      },
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    return null
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.warn(`[resolveGooglePlace] ${res.status} ${res.statusText}`, errBody.slice(0, 500))
    return null
  }

  const json = (await res.json()) as {
    location?: { latitude?: number; longitude?: number }
    formattedAddress?: string
  }
  const lat = json.location?.latitude
  const lng = json.location?.longitude
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  const result: PlaceDetails = { lat, lng, formattedAddress: json.formattedAddress }
  cache.set(placeId, result)
  return result
}
