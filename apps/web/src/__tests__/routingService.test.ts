import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Cache frais par test : le module-level LRU de routingService persisterait
// sinon un hit entre tests et fausserait les assertions fetch.
vi.mock('@/lib/persistedLru', () => {
  const store = new Map<string, unknown>()
  return {
    createPersistedLru: () => ({
      get: (k: string) => store.get(k),
      set: (k: string, v: unknown) => { store.set(k, v) },
      _clear: () => store.clear(),
    }),
  }
})

vi.mock('@/lib/decodePolyline', () => ({
  decodePolyline: (s: string) => (s ? [[1, 2], [3, 4]] : []),
}))

import { computeRoute, computeRouteGoogle } from '@/services/routingService'

const originalFetch = globalThis.fetch
const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  else process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = originalEnv
})

// ─── computeRoute (OSRM) ──────────────────────────────────────────────────────

describe('computeRoute', () => {
  it('retourne distance/durée arrondis depuis la réponse OSRM', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [{
          distance: 12_345,
          duration: 720,
          geometry: { type: 'LineString', coordinates: [[1, 2], [3, 4]] },
        }],
      }),
    }) as unknown as typeof fetch

    const result = await computeRoute({ lat: 48.85, lng: 2.35 }, { lat: 45.76, lng: 4.85 })

    expect(result.distance_km).toBe(12.3)
    expect(result.duration_min).toBe(12)
    expect(result.geometry).toEqual({ type: 'LineString', coordinates: [[1, 2], [3, 4]] })
  })

  it('construit l URL OSRM avec lng,lat;lng,lat', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ distance: 1000, duration: 60 }] }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await computeRoute({ lat: 48.85, lng: 2.35 }, { lat: 45.76, lng: 4.85 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('2.35,48.85;4.85,45.76')
    expect(url).toContain('overview=full')
    expect(url).toContain('geometries=geojson')
  })

  it('lève une erreur si la réponse n est pas ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch
    await expect(
      computeRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })
    ).rejects.toThrow('Erreur OSRM 503')
  })

  it('lève une erreur générique si fetch échoue (réseau)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch
    await expect(
      computeRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })
    ).rejects.toThrow('Impossible de joindre le service de routage')
  })

  it('propage AbortError sans le transformer', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' })
    globalThis.fetch = vi.fn().mockRejectedValue(abortErr) as unknown as typeof fetch
    await expect(
      computeRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('lève "Itinéraire introuvable" si aucune route n est retournée', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [] }),
    }) as unknown as typeof fetch
    await expect(
      computeRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })
    ).rejects.toThrow('Itinéraire introuvable')
  })

  it('retourne geometry=null si OSRM ne fournit pas de géométrie', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ distance: 500, duration: 30 }] }),
    }) as unknown as typeof fetch

    const result = await computeRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })
    expect(result.geometry).toBeNull()
    expect(result.distance_km).toBe(0.5)
    expect(result.duration_min).toBe(1)
  })
})

// ─── computeRouteGoogle ───────────────────────────────────────────────────────

describe('computeRouteGoogle', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = 'test-key'
  })

  it('retourne null si la clé Google n est pas configurée', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await computeRouteGoogle({ lat: 0, lng: 0 }, { lat: 1, lng: 1 })

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('parse distance/durée/polyline depuis la réponse Google Routes', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [{
          distanceMeters: 45_678,
          duration: '1800s',
          polyline: { encodedPolyline: 'abc' },
        }],
      }),
    }) as unknown as typeof fetch

    const result = await computeRouteGoogle({ lat: 48.85, lng: 2.35 }, { lat: 45.76, lng: 4.85 })

    expect(result).not.toBeNull()
    expect(result!.distance_km).toBe(45.7)
    expect(result!.duration_min).toBe(30)
    expect(result!.geometry).toEqual({ type: 'LineString', coordinates: [[1, 2], [3, 4]] })
  })

  it('envoie departureTime ISO si date future fournie', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ distanceMeters: 1000, duration: '120s' }] }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const future = new Date(Date.now() + 3600_000).toISOString()
    await computeRouteGoogle({ lat: 0, lng: 0 }, { lat: 1, lng: 1 }, undefined, future)

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.departureTime).toBeDefined()
    expect(body.routingPreference).toBe('TRAFFIC_AWARE')
    expect(body.origin.location.latLng).toEqual({ latitude: 0, longitude: 0 })
  })

  it('n envoie pas departureTime si la date est passée', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ distanceMeters: 1000, duration: '120s' }] }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const past = new Date(Date.now() - 3600_000).toISOString()
    await computeRouteGoogle({ lat: 0, lng: 0 }, { lat: 1, lng: 1 }, undefined, past)

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.departureTime).toBeUndefined()
  })

  it('sert depuis le cache pour un même trajet dans la même heure', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ distanceMeters: 1000, duration: '60s' }] }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const from = { lat: 12.345, lng: 67.890 }
    const to = { lat: 23.456, lng: 78.901 }
    await computeRouteGoogle(from, to)
    await computeRouteGoogle(from, to)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retourne null si status non-ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 }) as unknown as typeof fetch

    const result = await computeRouteGoogle({ lat: 10, lng: 10 }, { lat: 11, lng: 11 })

    expect(result).toBeNull()
  })

  it('retourne null si fetch échoue (non-abort)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('network')) as unknown as typeof fetch

    const result = await computeRouteGoogle({ lat: 20, lng: 20 }, { lat: 21, lng: 21 })

    expect(result).toBeNull()
  })

  it('propage AbortError', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' })
    globalThis.fetch = vi.fn().mockRejectedValue(abortErr) as unknown as typeof fetch

    await expect(
      computeRouteGoogle({ lat: 30, lng: 30 }, { lat: 31, lng: 31 })
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('retourne null si la réponse n a pas de distanceMeters', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ duration: '60s' }] }),
    }) as unknown as typeof fetch

    const result = await computeRouteGoogle({ lat: 40, lng: 40 }, { lat: 41, lng: 41 })

    expect(result).toBeNull()
  })

  it('retourne null si duration invalide', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ distanceMeters: 1000, duration: 'invalids' }] }),
    }) as unknown as typeof fetch

    const result = await computeRouteGoogle({ lat: 50, lng: 50 }, { lat: 51, lng: 51 })

    expect(result).toBeNull()
  })

  it('accepte une réponse sans polyline (geometry=null)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ distanceMeters: 2000, duration: '180s' }] }),
    }) as unknown as typeof fetch

    const result = await computeRouteGoogle({ lat: 60, lng: 60 }, { lat: 61, lng: 61 })

    expect(result).not.toBeNull()
    expect(result!.geometry).toBeNull()
    expect(result!.distance_km).toBe(2)
    expect(result!.duration_min).toBe(3)
  })
})
