import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockUser = { id: 'u1', email: 'driver@test.fr' }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

const mockUpdateDriver = vi.fn()
vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn((sel?: (s: { updateDriver: typeof mockUpdateDriver }) => unknown) =>
    sel ? sel({ updateDriver: mockUpdateDriver }) : { updateDriver: mockUpdateDriver }
  ),
}))

const mockGetDriver = vi.fn()
const mockUpdateDriverService = vi.fn()
vi.mock('@/services/driverService', () => ({
  driverService: {
    getDriver: (...a: unknown[]) => mockGetDriver(...a),
    updateDriver: (...a: unknown[]) => mockUpdateDriverService(...a),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetDriver.mockResolvedValue({ vehicle_model: 'Peugeot 308', vehicle_plate: 'AB-123-CD', cpam_enabled: true })
  mockUpdateDriverService.mockResolvedValue(undefined)
})

describe('useSettingsPreferences', () => {
  it('charge vehicleModel/vehiclePlate/cpamEnabled depuis driverService', async () => {
    const { useSettingsPreferences } = await import('@/components/dashboard/driver/profil/useSettingsPreferences')
    const { result } = renderHook(() => useSettingsPreferences())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.vehicleModel).toBe('Peugeot 308')
    expect(result.current.vehiclePlate).toBe('AB-123-CD')
    expect(result.current.cpamEnabled).toBe(true)
  })

  it('dirty=true après modification de cpamEnabled', async () => {
    const { useSettingsPreferences } = await import('@/components/dashboard/driver/profil/useSettingsPreferences')
    const { result } = renderHook(() => useSettingsPreferences())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.setCpamEnabled(false) })
    expect(result.current.dirty).toBe(true)
  })

  it('save() appelle driverService.updateDriver avec les bonnes valeurs', async () => {
    const { useSettingsPreferences } = await import('@/components/dashboard/driver/profil/useSettingsPreferences')
    const { result } = renderHook(() => useSettingsPreferences())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.save() })
    expect(mockUpdateDriverService).toHaveBeenCalledWith('u1', expect.objectContaining({
      vehicle_model: 'Peugeot 308',
      cpam_enabled: true,
    }))
    await waitFor(() => expect(result.current.saved).toBe(true))
  })

  it('erreur de chargement renseigne error', async () => {
    mockGetDriver.mockRejectedValueOnce(new Error('réseau KO'))
    const { useSettingsPreferences } = await import('@/components/dashboard/driver/profil/useSettingsPreferences')
    const { result } = renderHook(() => useSettingsPreferences())
    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})
