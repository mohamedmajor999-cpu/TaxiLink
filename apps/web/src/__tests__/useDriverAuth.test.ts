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

vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn(),
}))

vi.mock('@/services/profileService', () => ({
  profileService: { getProfile: (...a: unknown[]) => mockGetProfile(...a) },
}))

vi.mock('@/services/authService', () => ({
  authService: { signOut: (...a: unknown[]) => mockSignOut(...a) },
}))

import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
const mockUseAuth        = vi.mocked(useAuth)
const mockUseDriverStore = vi.mocked(useDriverStore)

beforeEach(() => {
  vi.clearAllMocks()
  mockLoad.mockResolvedValue(undefined)
  mockUseDriverStore.mockReturnValue({ load: mockLoad, driver: { name: 'Chauffeur Test' } } as ReturnType<typeof useDriverStore>)
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
})
