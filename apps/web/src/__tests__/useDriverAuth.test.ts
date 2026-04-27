import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDriverAuth } from '@/components/dashboard/driver/useDriverAuth'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPush       = vi.fn()
const mockLoad       = vi.fn()
const mockGetProfile = vi.fn()
const mockSignOut    = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Le hook utilise un selecteur (useDriverStore(s => ...)) ET un acces statique
// (useDriverStore.getState()). vi.mock est hoiste, donc on declare la fabrique
// du store via vi.hoisted() pour rester accessible dans la factory.
const { storeMock } = vi.hoisted(() => {
  const fn: any = vi.fn()
  fn.getState = vi.fn()
  return { storeMock: fn }
})
vi.mock('@/store/driverStore', () => ({ useDriverStore: storeMock }))

vi.mock('@/services/profileService', () => ({
  profileService: { getProfile: (...a: unknown[]) => mockGetProfile(...a) },
}))

import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
const mockUseAuth        = vi.mocked(useAuth)
const mockUseDriverStore = vi.mocked(useDriverStore)

beforeEach(() => {
  vi.clearAllMocks()
  mockLoad.mockResolvedValue(undefined)
  mockUseDriverStore.mockReturnValue({ load: mockLoad, driver: { name: 'Chauffeur Test' } } as ReturnType<typeof useDriverStore>)
  ;(storeMock.getState as ReturnType<typeof vi.fn>).mockReturnValue({ signOut: mockSignOut })
})

// ─── Auth guards ──────────────────────────────────────────────────────────────
describe('useDriverAuth — guards', () => {
  it('redirige vers /auth/login si pas d\'utilisateur', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false } as ReturnType<typeof useAuth>)
    renderHook(() => useDriverAuth())
    await act(async () => {})
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('ne fait rien tant que authLoading est true', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true } as ReturnType<typeof useAuth>)
    renderHook(() => useDriverAuth())
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockGetProfile).not.toHaveBeenCalled()
  })

  it('redirige vers /dashboard/client si role = client', async () => {
    const user = { id: 'u1', email: 'client@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue({ role: 'client' })

    renderHook(() => useDriverAuth())
    await act(async () => {})

    expect(mockPush).toHaveBeenCalledWith('/dashboard/client')
    expect(mockLoad).not.toHaveBeenCalled()
  })

  it('redirige vers /auth/login si profil introuvable', async () => {
    const user = { id: 'u2', email: 'x@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue(null)

    renderHook(() => useDriverAuth())
    await act(async () => {})

    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })
})

// ─── Chargement chauffeur ─────────────────────────────────────────────────────
describe('useDriverAuth — chargement', () => {
  it('appelle load() avec userId et email pour un chauffeur valide', async () => {
    const user = { id: 'drv-1', email: 'chauffeur@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue({ role: 'driver' })

    const { result } = renderHook(() => useDriverAuth())
    await act(async () => {})

    expect(mockLoad).toHaveBeenCalledWith('drv-1', 'chauffeur@taxi.fr')
    expect(result.current.loading).toBe(false)
    expect(result.current.driverName).toBe('Chauffeur Test')
  })
})

// ─── handleLogout ─────────────────────────────────────────────────────────────
describe('useDriverAuth — handleLogout', () => {
  it('appelle signOut et redirige vers /', async () => {
    const user = { id: 'drv-2', email: 'd@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue({ role: 'driver' })
    mockSignOut.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDriverAuth())
    await act(async () => {})
    await act(async () => { await result.current.handleLogout() })

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('ne redirige pas vers /auth/login après signOut', async () => {
    const user = { id: 'drv-3', email: 'd@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue({ role: 'driver' })
    mockSignOut.mockResolvedValue(undefined)

    const { result, rerender } = renderHook(() => useDriverAuth())
    await act(async () => {})
    await act(async () => { await result.current.handleLogout() })

    // Simule onAuthStateChange → user = null après signOut
    mockUseAuth.mockReturnValue({ user: null, loading: false } as ReturnType<typeof useAuth>)
    rerender()
    await act(async () => {})

    const calls = mockPush.mock.calls.map(([path]) => path)
    expect(calls).not.toContain('/auth/login')
    expect(calls).toContain('/')
  })
})
