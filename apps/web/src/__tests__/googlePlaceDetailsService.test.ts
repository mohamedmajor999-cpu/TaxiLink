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

import { resolveGooglePlace } from '@/services/googlePlaceDetailsService'

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

describe('resolveGooglePlace', () => {
  it('retourne null si la clé Google est absente', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    expect(await resolveGooglePlace('pid-1')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retourne les coords et formattedAddress depuis la réponse', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        location: { latitude: 48.85, longitude: 2.35 },
        formattedAddress: '10 rue X, Paris',
      }),
    }) as unknown as typeof fetch

    const result = await resolveGooglePlace('pid-parse')

    expect(result).toEqual({
      lat: 48.85,
      lng: 2.35,
      formattedAddress: '10 rue X, Paris',
    })
  })

  it('inclut sessionToken dans l URL quand fourni', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ location: { latitude: 1, longitude: 2 } }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await resolveGooglePlace('pid-session', undefined, 'sess-xyz')

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('pid-session')
    expect(url).toContain('sessionToken=sess-xyz')
  })

  it('URL-encode le placeId', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ location: { latitude: 1, longitude: 2 } }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await resolveGooglePlace('pid with spaces/chars')

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('pid%20with%20spaces%2Fchars')
  })

  it('retourne null si status non-ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 404, statusText: 'Not Found',
      text: async () => '',
    }) as unknown as typeof fetch
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(await resolveGooglePlace('pid-404')).toBeNull()
  })

  it('retourne null si la réponse n a pas de location valide', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ formattedAddress: 'X' }),
    }) as unknown as typeof fetch

    expect(await resolveGooglePlace('pid-no-loc')).toBeNull()
  })

  it('retourne null si fetch échoue (non-abort)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('network')) as unknown as typeof fetch

    expect(await resolveGooglePlace('pid-net')).toBeNull()
  })

  it('propage AbortError', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' })
    globalThis.fetch = vi.fn().mockRejectedValue(abortErr) as unknown as typeof fetch

    await expect(resolveGooglePlace('pid-abort')).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('utilise le cache LRU pour un même placeId', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ location: { latitude: 5, longitude: 6 } }),
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await resolveGooglePlace('pid-cache-unique')
    const second = await resolveGooglePlace('pid-cache-unique')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toEqual({ lat: 5, lng: 6, formattedAddress: undefined })
  })
})
