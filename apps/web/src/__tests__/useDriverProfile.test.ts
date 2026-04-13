import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDriverProfile } from '@/components/dashboard/driver/useDriverProfile'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetProfile    = vi.fn()
const mockGetDriver     = vi.fn()
const mockUpdateProfile = vi.fn()
const mockUpdateDriver  = vi.fn()

// Référence stable — évite la boucle infinie causée par useEffect([user])
const mockUser = { id: 'u1', email: 'marc@test.com' }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/services/profileService', () => ({
  profileService: {
    getProfile:    (...a: unknown[]) => mockGetProfile(...a),
    updateProfile: (...a: unknown[]) => mockUpdateProfile(...a),
  },
}))

vi.mock('@/services/driverService', () => ({
  driverService: {
    getDriver:    (...a: unknown[]) => mockGetDriver(...a),
    updateDriver: (...a: unknown[]) => mockUpdateDriver(...a),
  },
}))

const fakeProfile = { id: 'u1', full_name: 'Marc Dupont', phone: '0601020304', role: 'driver' }
const fakeDriver  = { id: 'u1', vehicle_model: 'Toyota', vehicle_plate: 'AA-001-BB', cpam_enabled: true, rating: 4.8, total_rides: 50, is_online: false }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetProfile.mockResolvedValue(fakeProfile)
  mockGetDriver.mockResolvedValue(fakeDriver)
  mockUpdateProfile.mockResolvedValue(undefined)
  mockUpdateDriver.mockResolvedValue(undefined)
})

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('useDriverProfile — chargement', () => {
  it('charge profil et driver au montage', async () => {
    const { result } = renderHook(() => useDriverProfile('Marc Dupont'))
    await waitFor(() => expect(result.current.profile.phone).toBe('0601020304'))
    expect(result.current.profile.full_name).toBe('Marc Dupont')
    expect(result.current.driver.vehicle_model).toBe('Toyota')
    expect(result.current.profile.email).toBe('marc@test.com')
  })
})

// ─── Sauvegarde ───────────────────────────────────────────────────────────────
describe('useDriverProfile — handleSave', () => {
  it('appelle les deux services et passe saved a true', async () => {
    const { result } = renderHook(() => useDriverProfile('Marc Dupont'))
    await waitFor(() => expect(result.current.profile.phone).toBe('0601020304'))

    await act(async () => { await result.current.handleSave() })

    expect(mockUpdateProfile).toHaveBeenCalledWith('u1', expect.objectContaining({ full_name: 'Marc Dupont' }))
    expect(mockUpdateDriver).toHaveBeenCalledWith('u1', expect.objectContaining({ vehicle_model: 'Toyota' }))
    expect(result.current.saved).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('affiche une erreur si la sauvegarde echoue', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Erreur reseau'))
    const { result } = renderHook(() => useDriverProfile('Marc Dupont'))
    await waitFor(() => expect(result.current.profile.phone).toBe('0601020304'))

    await act(async () => { await result.current.handleSave() })
    expect(result.current.error).toBe('Erreur reseau')
    expect(result.current.saved).toBe(false)
  })
})
