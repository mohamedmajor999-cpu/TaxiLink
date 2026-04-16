import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClientAuth } from '@/components/dashboard/client/useClientAuth'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPush           = vi.fn()
const mockGetProfile     = vi.fn()
const mockGetClientMissions = vi.fn()
const mockSignOut        = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/profileService', () => ({
  profileService: { getProfile: (...a: unknown[]) => mockGetProfile(...a) },
}))

vi.mock('@/services/authService', () => ({
  authService: { signOut: (...a: unknown[]) => mockSignOut(...a) },
}))

vi.mock('@/services/missionService', () => ({
  missionService: { getClientMissions: (...a: unknown[]) => mockGetClientMissions(...a) },
}))

import { useAuth } from '@/hooks/useAuth'
const mockUseAuth = vi.mocked(useAuth)

beforeEach(() => { vi.clearAllMocks() })

// ─── Redirection si non connecté ──────────────────────────────────────────────
describe('useClientAuth — auth', () => {
  it('redirige vers /auth/login si pas d\'utilisateur', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false } as ReturnType<typeof useAuth>)
    renderHook(() => useClientAuth())
    await act(async () => {})
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('ne fait rien tant que authLoading est true', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true } as ReturnType<typeof useAuth>)
    renderHook(() => useClientAuth())
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockGetProfile).not.toHaveBeenCalled()
  })
})

// ─── Chargement profil + missions ─────────────────────────────────────────────
describe('useClientAuth — chargement données', () => {
  it('charge le nom du client et ses missions', async () => {
    const user = { id: 'u1', email: 'client@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue({ full_name: 'Marie Dupont', role: 'client' })
    mockGetClientMissions.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }])

    const { result } = renderHook(() => useClientAuth())
    await act(async () => {})

    expect(result.current.clientName).toBe('Marie Dupont')
    expect(result.current.missions).toHaveLength(2)
    expect(result.current.loading).toBe(false)
  })

  it('utilise "Client" comme nom par défaut si full_name absent', async () => {
    const user = { id: 'u2', email: 'test@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue({ full_name: null, role: 'client' })
    mockGetClientMissions.mockResolvedValue([])

    const { result } = renderHook(() => useClientAuth())
    await act(async () => {})

    expect(result.current.clientName).toBe('Client')
  })

  it('redirige vers /dashboard/chauffeur si le rôle est driver', async () => {
    const user = { id: 'u3', email: 'driver@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue({ full_name: 'Jean', role: 'driver' })
    mockGetClientMissions.mockResolvedValue([])

    renderHook(() => useClientAuth())
    await act(async () => {})

    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur')
  })
})

// ─── handleLogout ─────────────────────────────────────────────────────────────
describe('useClientAuth — handleLogout', () => {
  it('appelle signOut et redirige vers /', async () => {
    const user = { id: 'u4', email: 'c@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue({ full_name: 'Test', role: 'client' })
    mockGetClientMissions.mockResolvedValue([])
    mockSignOut.mockResolvedValue(undefined)

    const { result } = renderHook(() => useClientAuth())
    await act(async () => {})
    await act(async () => { await result.current.handleLogout() })

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('ne redirige pas vers /auth/login après signOut', async () => {
    const user = { id: 'u5', email: 'c@taxi.fr' }
    mockUseAuth.mockReturnValue({ user, loading: false } as ReturnType<typeof useAuth>)
    mockGetProfile.mockResolvedValue({ full_name: 'Test', role: 'client' })
    mockGetClientMissions.mockResolvedValue([])
    mockSignOut.mockResolvedValue(undefined)

    const { result, rerender } = renderHook(() => useClientAuth())
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
