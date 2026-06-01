// Google Place Details (New) — resout placeId → coords, avec cache LRU 30j.

import { createPersistedLru } from './lib/persistedLru'
import { getGoogleProxyClient } from './lib/googleProxy'

const ENDPOINT = 'https://places.googleapis.com/v1/places'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

// Cle Google Maps : lue lazy a chaque appel (cf. googlePlacesSearchService).
let _injectedKey: string | undefined

export function setGoogleMapsKey(key: string): void {
  _injectedKey = key
}

function getKey(): string | undefined {
  if (_injectedKey !== undefined) return _injectedKey
  return typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_GOOGLE_MAPS_KEY : undefined
}

export interface PlaceDetails {
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
 * Recupere les coordonnees d'un lieu Google.
 * FieldMask `location` → SKU Essentials (le moins cher).
 * Appele seulement a la selection pour eviter des appels inutiles.
 */
export async function resolveGooglePlace(
  placeId: string,
  signal?: AbortSignal,
  sessionToken?: string,
): Promise<PlaceDetails | null> {
  const cached = cache.get(placeId)
  if (cached) return cached
  const key = getKey()
  const proxy = getGoogleProxyClient()
  if (!key && !proxy) return null

  let json: { location?: { latitude?: number; longitude?: number }; formattedAddress?: string }
  if (proxy) {
    try {
      json = (await proxy('place_details', { placeId }, signal)) as typeof json
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
      return null
    }
  } else {
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
    json = (await res.json()) as typeof json
  }

  const lat = json.location?.latitude
  const lng = json.location?.longitude
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  const result: PlaceDetails = { lat, lng, formattedAddress: json.formattedAddress }
  cache.set(placeId, result)
  return result
}
