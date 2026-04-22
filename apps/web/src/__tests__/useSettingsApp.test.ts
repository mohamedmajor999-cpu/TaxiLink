import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockRouterPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

const mockSignOut = vi.fn()
vi.mock('@/services/authService', () => ({
  authService: { signOut: () => mockSignOut() },
}))

// Zustand crée useDriverStore avec une méthode statique setState via create()
// On la remplace par un objet doté de setState pour éviter les conflits entre tests
const mockSetState = vi.fn()
const fakeUseDriverStore = Object.assign(
  vi.fn((sel?: (s: unknown) => unknown) => (sel ? sel({}) : {})),
  { setState: mockSetState, getState: vi.fn(() => ({})), subscribe: vi.fn(), destroy: vi.fn() },
)
vi.mock('@/store/driverStore', () => ({ useDriverStore: fakeUseDriverStore }))

beforeEach(() => {
  vi.clearAllMocks()
  mockSignOut.mockResolvedValue(undefined)
})

describe('useSettingsApp', () => {
  it('loggingOut=false et error=null au départ', async () => {
    const { useSettingsApp } = await import('@/components/dashboard/driver/profil/useSettingsApp')
    const { result } = renderHook(() => useSettingsApp())
    expect(result.current.loggingOut).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('logout appelle authService.signOut et router.push', async () => {
    const { useSettingsApp } = await import('@/components/dashboard/driver/profil/useSettingsApp')
    const { result } = renderHook(() => useSettingsApp())
    await act(async () => { await result.current.logout() })
    expect(mockSignOut).toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/login')
  })

  it('logout en erreur renseigne error et remet loggingOut à false', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('réseau KO'))
    const { useSettingsApp } = await import('@/components/dashboard/driver/profil/useSettingsApp')
    const { result } = renderHook(() => useSettingsApp())
    await act(async () => { await result.current.logout() })
    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.loggingOut).toBe(false)
  })
})
