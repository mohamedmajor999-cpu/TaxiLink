import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockGetUser = vi.fn()
const mockUnsubscribe = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockRefreshSession = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      refreshSession: mockRefreshSession,
    },
  })),
}))

import { useAuth } from '@/hooks/useAuth'

beforeEach(() => {
  vi.clearAllMocks()
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  })
  mockRefreshSession.mockResolvedValue({ data: { session: null }, error: null })
})

describe('useAuth — état initial', () => {
  it('loading est true au départ', () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
  })

  it('user est null au départ', () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
  })
})

describe('useAuth — getUser', () => {
  it('loading passe à false après résolution', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.loading).toBe(false)
  })

  it('user est défini si getUser retourne un utilisateur', async () => {
    const user = { id: 'u1', email: 'test@taxi.fr' }
    mockGetUser.mockResolvedValue({ data: { user } })
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.user).toEqual(user)
  })

  it('user reste null si getUser retourne null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.user).toBeNull()
  })
})

describe('useAuth — onAuthStateChange', () => {
  it('met à jour user lors d\'un changement d\'état', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    let authCb: ((event: string, session: any) => void) | undefined
    mockOnAuthStateChange.mockImplementation((cb) => {
      authCb = cb
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })

    const { result } = renderHook(() => useAuth())
    await act(async () => {})

    const user = { id: 'u2', email: 'new@taxi.fr' }
    act(() => { authCb?.('SIGNED_IN', { user }) })
    expect(result.current.user).toEqual(user)
  })

  it('met user à null lors d\'un SIGNED_OUT', async () => {
    const user = { id: 'u3', email: 'x@taxi.fr' }
    mockGetUser.mockResolvedValue({ data: { user } })
    let authCb: ((event: string, session: any) => void) | undefined
    mockOnAuthStateChange.mockImplementation((cb) => {
      authCb = cb
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })

    const { result } = renderHook(() => useAuth())
    await act(async () => {})

    act(() => { authCb?.('SIGNED_OUT', null) })
    expect(result.current.user).toBeNull()
  })

  it('appelle unsubscribe au démontage', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { unmount } = renderHook(() => useAuth())
    await act(async () => {})
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})

describe('useAuth — keep-alive sur visibilitychange', () => {
  it('refresh la session quand l\'onglet redevient visible', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    renderHook(() => useAuth())
    await act(async () => {})

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(mockRefreshSession).toHaveBeenCalled()
  })

  it('ne refresh pas si l\'onglet est cache', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    renderHook(() => useAuth())
    await act(async () => {})

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(mockRefreshSession).not.toHaveBeenCalled()
  })

  it('swallow les erreurs de refresh (ne throw pas)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockRefreshSession.mockRejectedValueOnce(new Error('network'))
    renderHook(() => useAuth())
    await act(async () => {})

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    expect(() => {
      act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    }).not.toThrow()
  })

  it('retire le listener au démontage', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const { unmount } = renderHook(() => useAuth())
    await act(async () => {})
    unmount()

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(mockRefreshSession).not.toHaveBeenCalled()
  })
})
