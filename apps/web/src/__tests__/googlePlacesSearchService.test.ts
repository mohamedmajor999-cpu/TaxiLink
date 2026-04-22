import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/persistedLru', () => {
  const store = new Map<string, unknown>()
  return {
    createPersistedLru: () => ({
      get: (k: string) => store.get(k),
      set: (k: string, v: unknown) => { store.set(k, v) },
    }),
  }
})

vi.mock('@/lib/cityProximity', () => ({
  detectCityProximity: () => ({ lat: 43.2965, lng: 5.3698 }),
}))

import {
  searchGoogle,
  primeGoogleAutocompleteCache,
  isGoogleMapsKeyConfigured,
} from '@/services/googlePlacesSearchService'

const originalFetch = globalThis.fetch
const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

beforeEach(() => {
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = 'test-key'
})

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  else process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = originalEnv
  vi.restoreAllMocks()
})

// ─── isGoogleMapsKeyConfigured ────────────────────────────────────────────────

describe('isGoogleMapsKeyConfigured', () => {
  it('retourne true quand la clé est présente', () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = 'xyz'
    expect(isGoogleMapsKeyConfigured()).toBe(true)
  })

  it('retourne false quand la clé est absente', () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    expect(isGoogleMapsKeyConfigured()).toBe(false)
  })
})

// ─── searchGoogle ─────────────────────────────────────────────────────────────

describe('searchGoogle', () => {
  const rawResponse = {
    suggestions: [
      {
        placePrediction: {
          placeId: 'pid-1',
          text: { text: '10 rue de la Paix, 75002 Paris' },
          structuredFormat: {
            mainText: { text: '10 rue de la Paix' },
            secondaryText: { text: '75002 Paris' },
          },
        },
      },
      {
        placePrediction: {
          placeId: 'pid-2',
          text: { text: 'Paris' },
          structuredFormat: { mainText: { text: 'Paris' } },
        },
      },
    ],
  }

  it('retourne [] si la requête fait moins de 3 caractères', async () => {
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    expect(await searchGoogle('a')).toEqual([])
    expect(await searchGoogle('  ab  ')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retourne [] si la clé Google est absente', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    expect(await searchGoogle('paris')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mappe les prédictions en AddressSuggestion avec label "main, secondary"', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => rawResponse,
    }) as unknown as typeof fetch

    const result = await searchGoogle('10 rue paix unique-query-1')

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      label: '10 rue de la Paix, 75002 Paris',
      placeId: 'pid-1',
      mainText: '10 rue de la Paix',
      lat: 0,
      lng: 0,
    })
    expect(result[1]).toMatchObject({
      label: 'Paris',
      placeId: 'pid-2',
    })
  })

  it('attribue un score décroissant du 1er au dernier item', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => rawResponse,
    }) as unknown as typeof fetch

    const result = await searchGoogle('10 rue paix unique-query-2')

    expect(result[0].score).toBeGreaterThan(result[1].score)
    expect(result[0].score).toBeLessThanOrEqual(1)
  })

  it('ignore les prédictions sans placeId ou sans label', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          { placePrediction: { text: { text: 'Sans placeId' } } },
          { placePrediction: { placeId: 'pid-x', structuredFormat: {} } },
          { placePrediction: { placeId: 'pid-y', text: { text: 'OK' }, structuredFormat: { mainText: { text: 'OK' } } } },
        ],
      }),
    }) as unknown as typeof fetch

    const result = await searchGoogle('filtre unique-query-3')

    expect(result).toHaveLength(1)
    expect(result[0].placeId).toBe('pid-y')
  })

  it('envoie locationBias et sessionToken dans le body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ suggestions: [] }) })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await searchGoogle('paris unique-query-4', undefined, { lat: 10, lng: 20 }, 'sess-abc')

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.input).toBe('paris unique-query-4')
    expect(body.sessionToken).toBe('sess-abc')
    expect(body.locationBias.circle.center).toEqual({ latitude: 10, longitude: 20 })
    expect(body.locationBias.circle.radius).toBe(50000)
  })

  it('lève "Clé Google refusée" sur 403', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 403, statusText: 'Forbidden',
      text: async () => '',
    }) as unknown as typeof fetch
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(searchGoogle('query 403 unique')).rejects.toThrow('Clé Google refusée')
  })

  it('lève "Quota Google dépassé" sur 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 429, statusText: 'Too Many',
      text: async () => '',
    }) as unknown as typeof fetch
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(searchGoogle('query 429 unique')).rejects.toThrow('Quota Google dépassé')
  })

  it('lève "Erreur Google" avec le status sur autres codes', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 500, statusText: 'Server',
      text: async () => '',
    }) as unknown as typeof fetch
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(searchGoogle('query 500 unique')).rejects.toThrow('Erreur Google (500)')
  })

  it('retourne [] si fetch échoue (non-abort)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('network')) as unknown as typeof fetch

    expect(await searchGoogle('query network unique')).toEqual([])
  })

  it('propage AbortError', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' })
    globalThis.fetch = vi.fn().mockRejectedValue(abortErr) as unknown as typeof fetch

    await expect(searchGoogle('query abort unique')).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('utilise le cache LRU entre deux appels identiques', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => rawResponse,
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await searchGoogle('cache-test-query')
    await searchGoogle('cache-test-query')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('la clé de cache normalise casse et accents (même cache pour "Pàris" et "paris")', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => rawResponse,
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await searchGoogle('Nôrmalisé-tëst')
    await searchGoogle('normalise-test')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

// ─── primeGoogleAutocompleteCache ─────────────────────────────────────────────

describe('primeGoogleAutocompleteCache', () => {
  it('n appelle pas fetch si la requête pré-cachée est ensuite relancée', async () => {
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    primeGoogleAutocompleteCache('Hôpital Timone, Marseille', {
      label: 'Hôpital Timone, Marseille',
      lat: 43.34,
      lng: 5.40,
      placeId: 'pid-timone',
      score: 1,
    })

    const result = await searchGoogle('Hôpital Timone, Marseille')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result[0].placeId).toBe('pid-timone')
  })

  it('ignore les requêtes < 3 caractères', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    primeGoogleAutocompleteCache('ab', {
      label: 'ab', lat: 0, lng: 0, score: 1,
    })

    await searchGoogle('ab plus long')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
