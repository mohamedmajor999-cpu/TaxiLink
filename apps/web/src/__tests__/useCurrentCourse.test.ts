import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCurrentCourse } from '@/components/dashboard/driver/course/useCurrentCourse'
import type { Mission } from '@/lib/supabase/types'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPush             = vi.fn()
const mockGetCurrent       = vi.fn()
const mockCancel           = vi.fn()
const mockComplete         = vi.fn()
const mockFetchOsrm        = vi.fn()
const mockFetchGoogleTraffic = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn(),
}))

vi.mock('@/services/missionService', () => ({
  missionService: {
    getCurrentForDriver: (...a: unknown[]) => mockGetCurrent(...a),
    cancel:              (...a: unknown[]) => mockCancel(...a),
    complete:            (...a: unknown[]) => mockComplete(...a),
  },
}))

vi.mock('@/lib/osrmRoute', () => ({
  fetchOsrmRoute: (...a: unknown[]) => mockFetchOsrm(...a),
}))

vi.mock('@/lib/googleRoutes', () => ({
  fetchGoogleRoutesTraffic: (...a: unknown[]) => mockFetchGoogleTraffic(...a),
}))

import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
const mockUseAuth        = vi.mocked(useAuth)
const mockUseDriverStore = vi.mocked(useDriverStore)

function primeDriverStore(driver: { id?: string; name?: string } = { id: 'drv-1', name: 'Youssef B.' }) {
  mockUseDriverStore.mockImplementation(((selector?: unknown) => {
    const state = { driver }
    return typeof selector === 'function'
      ? (selector as (s: unknown) => unknown)(state)
      : state
  }) as unknown as typeof useDriverStore)
}

const missionFull = {
  id: 'm1',
  phone: '06 12 34 56 78',
  departure: '1 rue A, Paris',
  destination: '2 rue B, Lyon',
  departure_lat: 48.85, departure_lng: 2.35,
  destination_lat: 45.75, destination_lng: 4.85,
  scheduled_at: '2026-05-01T09:00:00.000Z',
} as unknown as Mission

beforeEach(() => {
  vi.clearAllMocks()
  primeDriverStore()
  mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false } as ReturnType<typeof useAuth>)
  mockGetCurrent.mockResolvedValue(null)
  mockCancel.mockResolvedValue(undefined)
  mockComplete.mockResolvedValue(undefined)
  mockFetchOsrm.mockResolvedValue(null)
  mockFetchGoogleTraffic.mockResolvedValue(null)
})

// ─── Chargement ──────────────────────────────────────────────────────────────
describe('useCurrentCourse — chargement', () => {
  it('ne fait rien si aucun user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false } as ReturnType<typeof useAuth>)
    renderHook(() => useCurrentCourse())
    expect(mockGetCurrent).not.toHaveBeenCalled()
  })

  it('charge la mission courante pour le user connecte', async () => {
    mockGetCurrent.mockResolvedValueOnce(missionFull)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockGetCurrent).toHaveBeenCalledWith('u1')
    expect(result.current.mission).toBe(missionFull)
  })

  it('met loading a false meme si la mission est null', async () => {
    mockGetCurrent.mockResolvedValueOnce(null)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.mission).toBeNull()
  })

  it('met loading a false meme si la requete echoue', async () => {
    mockGetCurrent.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.loading).toBe(false))
  })
})

// ─── Coords from / to ────────────────────────────────────────────────────────
describe('useCurrentCourse — from / to', () => {
  it('from et to sont null si la mission na pas de coords', async () => {
    mockGetCurrent.mockResolvedValueOnce({
      ...missionFull,
      departure_lat: null, departure_lng: null,
      destination_lat: null, destination_lng: null,
    } as unknown as Mission)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.from).toBeNull()
    expect(result.current.to).toBeNull()
  })

  it('from et to sont definis quand la mission a des coords', async () => {
    mockGetCurrent.mockResolvedValueOnce(missionFull)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.from).toEqual({ lat: 48.85, lng: 2.35 }))
    expect(result.current.to).toEqual({ lat: 45.75, lng: 4.85 })
  })
})

// ─── Liens SMS / Waze / Google Maps ──────────────────────────────────────────
describe('useCurrentCourse — liens externes', () => {
  it('smsHref inclut le nom du chauffeur et un telephone nettoye', async () => {
    mockGetCurrent.mockResolvedValueOnce(missionFull)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.mission).not.toBeNull())
    expect(result.current.smsHref).toContain('sms:0612345678')
    expect(result.current.smsHref).toContain(encodeURIComponent('Youssef B.'))
  })

  it('smsHref fallback sans nom chauffeur', async () => {
    primeDriverStore({ id: 'drv-1', name: '' })
    mockGetCurrent.mockResolvedValueOnce(missionFull)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.mission).not.toBeNull())
    expect(result.current.smsHref).toContain(encodeURIComponent('votre chauffeur'))
  })

  it('wazeHref pointe sur les coords destination', async () => {
    mockGetCurrent.mockResolvedValueOnce(missionFull)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.mission).not.toBeNull())
    expect(result.current.wazeHref).toBe('https://waze.com/ul?ll=45.75%2C4.85&navigate=yes')
  })

  it('gmapsHref utilise le libelle quand les coords manquent', async () => {
    mockGetCurrent.mockResolvedValueOnce({
      ...missionFull,
      destination_lat: null, destination_lng: null,
    } as unknown as Mission)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.mission).not.toBeNull())
    expect(result.current.gmapsHref).toContain(encodeURIComponent('2 rue B, Lyon'))
  })
})

// ─── cancel / complete ───────────────────────────────────────────────────────
describe('useCurrentCourse — actions', () => {
  it('cancel appelle missionService.cancel et redirige vers /dashboard/chauffeur', async () => {
    mockGetCurrent.mockResolvedValueOnce(missionFull)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.mission).not.toBeNull())

    await act(async () => { await result.current.cancel('raison X') })
    expect(mockCancel).toHaveBeenCalledWith('m1', 'raison X')
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur')
  })

  it('cancel remet cancelling a false si echec', async () => {
    mockGetCurrent.mockResolvedValueOnce(missionFull)
    mockCancel.mockRejectedValueOnce(new Error('refuse'))
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.mission).not.toBeNull())

    await act(async () => { await result.current.cancel('raison') })
    expect(result.current.cancelling).toBe(false)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('complete appelle missionService.complete et redirige', async () => {
    mockGetCurrent.mockResolvedValueOnce(missionFull)
    const { result } = renderHook(() => useCurrentCourse())
    await waitFor(() => expect(result.current.mission).not.toBeNull())

    await act(async () => { await result.current.complete() })
    expect(mockComplete).toHaveBeenCalledWith('m1')
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur')
  })
})
