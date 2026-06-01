// Google Places Autocomplete (New) — predictions avec cache LRU 30j.

import { createPersistedLru } from './lib/persistedLru'
import { detectCityProximity } from '@taxilink/core'
import { getGoogleProxyClient } from './lib/googleProxy'

const ENDPOINT = 'https://places.googleapis.com/v1/places:autocomplete'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

// Cle Google Maps : sur web, lue depuis NEXT_PUBLIC_GOOGLE_MAPS_KEY a chaque
// appel (les tests changent l'env var entre tests). Sur mobile, doit etre
// injectee via setGoogleMapsKey() au boot — l'override prend precedence.
let _injectedKey: string | undefined

export function setGoogleMapsKey(key: string): void {
  _injectedKey = key
}

function getKey(): string | undefined {
  if (_injectedKey !== undefined) return _injectedKey
  return typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_GOOGLE_MAPS_KEY : undefined
}

/** `true` si la cle Google Maps est configuree ; sinon l'UI peut afficher
 *  un message explicite plutot que de laisser un champ silencieux. */
export function isGoogleMapsKeyConfigured(): boolean {
  return !!getKey()
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

// Persiste en localStorage : cle = query|bias_geo pour isoler par zone.
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

// Pre-peuple le cache avec un label deja resolu → hit direct quand l'input
// reprend ce label enrichi (evite un Autocomplete facture inutilement).
export function primeGoogleAutocompleteCache(query: string, suggestion: AddressSuggestion): void {
  const trimmed = query.trim()
  if (trimmed.length < 3) return
  cache.set(cacheKey(trimmed, detectCityProximity(trimmed)), [suggestion])
}

// Autocomplete Google Places. Retourne predictions sans coordonnees (a
// resoudre via resolveGooglePlace). `sessionToken` groupe Autocomplete +
// Details dans la meme session facturee.
export async function searchGoogle(
  query: string,
  signal?: AbortSignal,
  proximity?: { lat: number; lng: number } | null,
  sessionToken?: string,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []
  // On accepte soit une clé locale (web), soit un proxy serveur branché (mobile).
  const key = getKey()
  const proxy = getGoogleProxyClient()
  if (!key && !proxy) return []

  const bias = proximity ?? detectCityProximity(trimmed)
  const cKey = cacheKey(trimmed, bias)
  const cached = cache.get(cKey)
  if (cached) return cached

  // Si un proxy est branché (mobile via Edge Function `google-cache`), on
  // route via lui — le proxy se charge du cache partagé serveur + appel Google
  // avec la clé secrète. Sinon fallback fetch direct (web ou tests).
  let json: { suggestions?: RawSuggestion[] }
  if (proxy) {
    try {
      json = (await proxy('places_autocomplete', { query: trimmed, bias }, signal)) as { suggestions?: RawSuggestion[] }
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
      throw new Error(`Erreur proxy Google (${(err as Error).message})`)
    }
  } else {
    if (!key) return []
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
    json = (await res.json()) as { suggestions?: RawSuggestion[] }
  }
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
