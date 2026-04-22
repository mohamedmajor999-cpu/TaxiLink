// Google Places Autocomplete (New) — prédictions avec cache LRU 30j.

import { createPersistedLru } from '@/lib/persistedLru'
import { detectCityProximity } from '@/lib/cityProximity'

const ENDPOINT = 'https://places.googleapis.com/v1/places:autocomplete'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

// `true` si la clé Google Maps est configurée côté client ; sinon l'UI peut
// afficher un message explicite plutôt que de laisser un champ silencieux.
export function isGoogleMapsKeyConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
}

export interface AddressSuggestion {
  label: string
  lat: number
  lng: number
  score: number
  placeId?: string
  mainText?: string
}

interface RawSuggestion {
  placePrediction?: {
    placeId?: string
    text?: { text?: string }
    structuredFormat?: {
      mainText?: { text?: string }
      secondaryText?: { text?: string }
    }
  }
}

// Persisté en localStorage : clé = query|bias_geo pour isoler par zone.
const cache = createPersistedLru<AddressSuggestion[]>({
  storageKey: 'taxilink.placesCache.v1',
  maxSize: 200,
  ttlMs: TTL_MS,
})

function normalizeQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

function cacheKey(query: string, bias: { lat: number; lng: number } | null): string {
  const b = bias ? `${bias.lat.toFixed(2)},${bias.lng.toFixed(2)}` : 'no'
  return `${normalizeQuery(query)}|${b}`
}

// Pré-peuple le cache avec un label déjà résolu → hit direct quand l'input
// reprend ce label enrichi (évite un Autocomplete facturé inutilement).
export function primeGoogleAutocompleteCache(query: string, suggestion: AddressSuggestion): void {
  const trimmed = query.trim()
  if (trimmed.length < 3) return
  cache.set(cacheKey(trimmed, detectCityProximity(trimmed)), [suggestion])
}

// Autocomplete Google Places. Retourne prédictions sans coordonnées (à
// résoudre via resolveGooglePlace). `sessionToken` groupe Autocomplete +
// Details dans la même session facturée. Requiert NEXT_PUBLIC_GOOGLE_MAPS_KEY.
export async function searchGoogle(
  query: string,
  signal?: AbortSignal,
  proximity?: { lat: number; lng: number } | null,
  sessionToken?: string,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!key) return []

  const bias = proximity ?? detectCityProximity(trimmed)
  const cKey = cacheKey(trimmed, bias)
  const cached = cache.get(cKey)
  if (cached) return cached

  const body: Record<string, unknown> = {
    input: trimmed,
    languageCode: 'fr',
    regionCode: 'fr',
  }
  if (bias) {
    body.locationBias = {
      circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 50000 },
    }
  }
  if (sessionToken) body.sessionToken = sessionToken

  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    return []
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.warn(`[searchGoogle] ${res.status} ${res.statusText}`, errBody.slice(0, 500))
    const msg = res.status === 403
      ? 'Clé Google refusée (domaine ou API non autorisés).'
      : res.status === 429
        ? 'Quota Google dépassé.'
        : `Erreur Google (${res.status}).`
    throw new Error(msg)
  }

  const json = (await res.json()) as { suggestions?: RawSuggestion[] }
  const items = json.suggestions ?? []
  const total = items.length
  const out: AddressSuggestion[] = []
  items.forEach((s, i) => {
    const pred = s.placePrediction
    const placeId = pred?.placeId
    const main = pred?.structuredFormat?.mainText?.text
    const secondary = pred?.structuredFormat?.secondaryText?.text
    const full = pred?.text?.text
    const label = main ? (secondary ? `${main}, ${secondary}` : main) : full
    if (!label || !placeId) return
    out.push({
      label,
      lat: 0,
      lng: 0,
      placeId,
      mainText: main,
      score: total > 0 ? (total - i) / total : 0,
    })
  })
  cache.set(cKey, out)
  return out
}
