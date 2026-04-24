import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDriverHome } from '@/components/dashboard/driver/useDriverHome'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockSetOnline          = vi.fn()
const mockAcceptMission      = vi.fn()
const mockCompleteMission    = vi.fn()
const mockGetMyGroups        = vi.fn()
const mockRequestNotifPerm   = vi.fn()
const mockSetFilter          = vi.fn()
const mockSetSort            = vi.fn()
const mockSetSelectedGroupId = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn(),
}))

vi.mock('@/hooks/useNextMissionNotification', () => ({
  useNextMissionNotification: vi.fn(() => ({
    permission: 'default' as NotificationPermission,
    requestPermission: mockRequestNotifPerm,
  })),
}))

vi.mock('@/services/groupService', () => ({
  groupService: {
    getMyGroups: (...a: unknown[]) => mockGetMyGroups(...a),
  },
}))

vi.mock('@/components/dashboard/driver/useDriverMissions', () => ({
  useDriverMissions: vi.fn(),
}))

vi.mock('@/components/dashboard/driver/home/useDriverHomeFilters', () => ({
  useDriverHomeFilters: vi.fn(),
  HOME_GROUP_PUBLIC: '__public__',
  HOME_TYPE_FILTERS: [],
  HOME_SORT_OPTIONS: [],
}))

import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
import { useDriverMissions } from '@/components/dashboard/driver/useDriverMissions'
import { useDriverHomeFilters } from '@/components/dashboard/driver/home/useDriverHomeFilters'

const mockUseAuth              = vi.mocked(useAuth)
const mockUseDriverStore       = vi.mocked(useDriverStore)
const mockUseDriverMissions    = vi.mocked(useDriverMissions)
const mockUseDriverHomeFilters = vi.mocked(useDriverHomeFilters)

function primeDriverStore(driver: { id?: string; name?: string } = { id: 'drv-1', name: 'Youssef Benali' }) {
  mockUseDriverStore.mockImplementation(((selector?: unknown) => {
    const state = { driver, setOnline: mockSetOnline }
    return typeof selector === 'function'
      ? (selector as (s: unknown) => unknown)(state)
      : state
  }) as unknown as typeof useDriverStore)
}

beforeEach(() => {
  vi.clearAllMocks()
  primeDriverStore()
  mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false } as ReturnType<typeof useAuth>)
  mockUseDriverMissions.mockReturnValue({
    missions: [],
    loading: false,
    error: null,
    currentMission: null,
    acceptMission: mockAcceptMission,
    completeMission: mockCompleteMission,
  } as unknown as ReturnType<typeof useDriverMissions>)
  mockUseDriverHomeFilters.mockReturnValue({
    filter: 'ALL',
    setFilter: mockSetFilter,
    sort: 'soonest',
    setSort: mockSetSort,
    selectedGroupId: null,
    setSelectedGroupId: mockSetSelectedGroupId,
    cards: [],
    filteredMissions: [],
    counts: { ALL: 0, CPAM: 0, PRIVE: 0 },
    scopeLabel: 'tous mes groupes',
    scopeCount: 0,
  } as unknown as ReturnType<typeof useDriverHomeFilters>)
  mockGetMyGroups.mockResolvedValue([])

  // Geolocation mock : rejet silencieux par defaut.
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    geolocation: {
      getCurrentPosition: vi.fn((_ok, err) => err?.({ code: 1 } as GeolocationPositionError)),
      watchPosition: vi.fn((_ok, err) => { err?.({ code: 1 } as GeolocationPositionError); return 1 }),
      clearWatch: vi.fn(),
    },
  })
})

// ─── Initiales a partir du nom du chauffeur ──────────────────────────────────
describe('useDriverHome — initiales', () => {
  it('prend les deux premieres initiales du nom', () => {
    primeDriverStore({ id: 'drv-1', name: 'Youssef Benali' })
    const { result } = renderHook(() => useDriverHome())
    expect(result.current.initials).toBe('YB')
  })

  it('fallback sur YB quand le nom est vide', () => {
    primeDriverStore({ id: 'drv-1', name: '' })
    const { result } = renderHook(() => useDriverHome())
    expect(result.current.initials).toBe('YB')
  })

  it('uppercase les initiales', () => {
    primeDriverStore({ id: 'drv-1', name: 'marie curie' })
    const { result } = renderHook(() => useDriverHome())
    expect(result.current.initials).toBe('MC')
  })
})

// ─── Geolocalisation ─────────────────────────────────────────────────────────
describe('useDriverHome — geolocalisation', () => {
  it('hasUserCoords est false si la permission est refusee', () => {
    const { result } = renderHook(() => useDriverHome())
    expect(result.current.hasUserCoords).toBe(false)
    expect(result.current.userCoords).toBeNull()
  })

  it('hasUserCoords devient true quand les coords sont recues', () => {
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      geolocation: {
        getCurrentPosition: vi.fn((ok) => ok({ coords: { latitude: 43.3, longitude: 5.4 } } as GeolocationPosition)),
        watchPosition: vi.fn((ok) => { ok({ coords: { latitude: 43.3, longitude: 5.4 } } as GeolocationPosition); return 1 }),
        clearWatch: vi.fn(),
      },
    })
    const { result } = renderHook(() => useDriverHome())
    expect(result.current.hasUserCoords).toBe(true)
    expect(result.current.userCoords).toEqual({ lat: 43.3, lng: 5.4 })
  })

  it('requestLocation est expose et peut etre rappele', () => {
    const { result } = renderHook(() => useDriverHome())
    expect(typeof result.current.requestLocation).toBe('function')
    act(() => { result.current.requestLocation() })
    // Pas d'erreur = geolocation appelee sans crash
  })
})

// ─── Chargement des groupes ──────────────────────────────────────────────────
describe('useDriverHome — groupes', () => {
  it('charge les groupes via groupService', async () => {
    const gs = [{ id: 'g1', name: 'G1' }]
    mockGetMyGroups.mockResolvedValueOnce(gs)
    const { result } = renderHook(() => useDriverHome())
    await waitFor(() => expect(result.current.groups).toEqual(gs))
    expect(mockGetMyGroups).toHaveBeenCalledWith('u1')
  })

  it('ne charge pas les groupes sans user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false } as ReturnType<typeof useAuth>)
    renderHook(() => useDriverHome())
    expect(mockGetMyGroups).not.toHaveBeenCalled()
  })

  it('groupes restent vides si le service echoue', async () => {
    mockGetMyGroups.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useDriverHome())
    // Laisse le microtask se vider
    await act(async () => {})
    expect(result.current.groups).toEqual([])
  })
})

// ─── Expose les actions du store missions ────────────────────────────────────
describe('useDriverHome — actions missions', () => {
  it('expose acceptMission et completeMission depuis useDriverMissions', () => {
    const { result } = renderHook(() => useDriverHome())
    expect(result.current.acceptMission).toBe(mockAcceptMission)
    expect(result.current.completeMission).toBe(mockCompleteMission)
  })

  it('expose setOnline depuis driverStore', () => {
    const { result } = renderHook(() => useDriverHome())
    expect(result.current.setOnline).toBe(mockSetOnline)
  })
})

// ─── Notifications ───────────────────────────────────────────────────────────
describe('useDriverHome — notifications', () => {
  it('expose la permission et la fonction de demande', () => {
    const { result } = renderHook(() => useDriverHome())
    expect(result.current.notificationPermission).toBe('default')
    expect(result.current.requestNotificationPermission).toBe(mockRequestNotifPerm)
  })
})
