import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockUser = { id: 'u1', email: 'test@test.fr' }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

const mockUpdateDriver = vi.fn()
vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn((sel?: (s: { updateDriver: typeof mockUpdateDriver }) => unknown) =>
    sel ? sel({ updateDriver: mockUpdateDriver }) : { updateDriver: mockUpdateDriver }
  ),
}))

const mockGetProfile = vi.fn()
const mockUpdateProfile = vi.fn()
vi.mock('@/services/profileService', () => ({
  profileService: {
    getProfile: (...a: unknown[]) => mockGetProfile(...a),
    updateProfile: (...a: unknown[]) => mockUpdateProfile(...a),
  },
}))

vi.mock('@/lib/validators', () => ({
  isValidPhone: (v: string) => /^0[0-9]{9}$/.test(v),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetProfile.mockResolvedValue({
    first_name: 'Jean',
    last_name: 'Dupont',
    full_name: 'Jean Dupont',
    phone: '0601020304',
  })
  mockUpdateProfile.mockResolvedValue(undefined)
})

describe('useSettingsCompte', () => {
  it('charge firstName/lastName et phone depuis profileService', async () => {
    const { useSettingsCompte } = await import('@/components/dashboard/driver/profil/useSettingsCompte')
    const { result } = renderHook(() => useSettingsCompte())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.firstName).toBe('Jean')
    expect(result.current.lastName).toBe('Dupont')
    expect(result.current.phone).toBe('0601020304')
  })

  it('email vient de user.email', async () => {
    const { useSettingsCompte } = await import('@/components/dashboard/driver/profil/useSettingsCompte')
    const { result } = renderHook(() => useSettingsCompte())
    expect(result.current.email).toBe('test@test.fr')
  })

  it('dirty=true après modification du prénom', async () => {
    const { useSettingsCompte } = await import('@/components/dashboard/driver/profil/useSettingsCompte')
    const { result } = renderHook(() => useSettingsCompte())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.setFirstName('Paul') })
    expect(result.current.dirty).toBe(true)
  })

  it("save() échoue si prénom < 2 caractères", async () => {
    const { useSettingsCompte } = await import('@/components/dashboard/driver/profil/useSettingsCompte')
    const { result } = renderHook(() => useSettingsCompte())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.setFirstName('A') })
    await act(async () => { await result.current.save() })
    expect(result.current.error).toContain('2 caractères')
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('save() réussit et transmet first_name + last_name', async () => {
    const { useSettingsCompte } = await import('@/components/dashboard/driver/profil/useSettingsCompte')
    const { result } = renderHook(() => useSettingsCompte())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.save() })
    expect(mockUpdateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({
      first_name: 'Jean',
      last_name: 'Dupont',
    }))
    await waitFor(() => expect(result.current.saved).toBe(true))
  })

  it("save() rejette un téléphone invalide", async () => {
    const { useSettingsCompte } = await import('@/components/dashboard/driver/profil/useSettingsCompte')
    const { result } = renderHook(() => useSettingsCompte())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.setPhone('abc') })
    await act(async () => { await result.current.save() })
    expect(result.current.error).toContain('téléphone')
  })
})
