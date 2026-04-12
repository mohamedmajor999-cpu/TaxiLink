import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHistoriqueScreen } from './useHistoriqueScreen'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const { mockGetDoneByDriver, mockUser } = vi.hoisted(() => ({
  mockGetDoneByDriver: vi.fn(),
  mockUser: { id: 'drv-1' },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/services/missionService', () => ({
  missionService: { getDoneByDriver: mockGetDoneByDriver },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const fakeMissions = [
  {
    id: 'm1', type: 'CPAM', status: 'DONE',
    departure: 'Paris', destination: 'Lyon',
    distance_km: 100, price_eur: 50,
    scheduled_at: '2026-04-01T10:00:00Z',
    driver_id: 'drv-1', patient_name: 'Alice',
    phone: null, client_id: null,
    created_at: '2026-04-01T09:00:00Z',
    accepted_at: null, completed_at: '2026-04-01T12:00:00Z',
  },
  {
    id: 'm2', type: 'PRIVE', status: 'DONE',
    departure: 'Marseille', destination: 'Nice',
    distance_km: 200, price_eur: 80,
    scheduled_at: '2026-04-02T10:00:00Z',
    driver_id: 'drv-1', patient_name: null,
    phone: '0601020304', client_id: null,
    created_at: '2026-04-02T09:00:00Z',
    accepted_at: null, completed_at: '2026-04-02T12:00:00Z',
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useHistoriqueScreen', () => {
  it('démarre en état loading', () => {
    mockGetDoneByDriver.mockResolvedValue([])
    const { result } = renderHook(() => useHistoriqueScreen())
    expect(result.current.loading).toBe(true)
  })

  it('charge les courses depuis getDoneByDriver', async () => {
    mockGetDoneByDriver.mockResolvedValue(fakeMissions)
    const { result } = renderHook(() => useHistoriqueScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rides).toHaveLength(2)
    expect(mockGetDoneByDriver).toHaveBeenCalledWith('drv-1')
  })

  it('calcule le total des courses', async () => {
    mockGetDoneByDriver.mockResolvedValue(fakeMissions)
    const { result } = renderHook(() => useHistoriqueScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.totalRides).toBe(2)
  })

  it('calcule les revenus totaux', async () => {
    mockGetDoneByDriver.mockResolvedValue(fakeMissions)
    const { result } = renderHook(() => useHistoriqueScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.totalEarnings).toBe(130)
  })

  it('calcule les kilomètres totaux', async () => {
    mockGetDoneByDriver.mockResolvedValue(fakeMissions)
    const { result } = renderHook(() => useHistoriqueScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.totalKm).toBe(300)
  })

  it('retourne 0 pour tous les totaux si aucune course', async () => {
    mockGetDoneByDriver.mockResolvedValue([])
    const { result } = renderHook(() => useHistoriqueScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.totalRides).toBe(0)
    expect(result.current.totalEarnings).toBe(0)
    expect(result.current.totalKm).toBe(0)
  })

  it('met error si getDoneByDriver échoue', async () => {
    mockGetDoneByDriver.mockRejectedValue(new Error('Erreur réseau'))
    const { result } = renderHook(() => useHistoriqueScreen())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Erreur réseau')
    expect(result.current.rides).toHaveLength(0)
  })
})
