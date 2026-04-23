import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDriverMissions } from '@/components/dashboard/driver/useDriverMissions'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetAvailable       = vi.fn()
const mockGetCurrentForDriver = vi.fn()
const mockAccept             = vi.fn()
const mockComplete           = vi.fn()

const mockUser = { id: 'drv-1' }
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/hooks/useToasts', () => ({
  useToasts: () => ({ toasts: [], addToast: vi.fn(), dismissToast: vi.fn() }),
}))

vi.mock('@/hooks/useMissionRealtime', () => ({
  useMissionRealtime: vi.fn(),
}))

const STABLE_EMPTY: string[] = []
const STABLE_SAVE = async () => {}
vi.mock('@/hooks/useDeptPreferences', () => ({
  useDeptPreferences: () => ({ depts: STABLE_EMPTY, loading: false, save: STABLE_SAVE }),
}))

vi.mock('@/services/missionService', () => ({
  missionService: {
    getAvailable:        (...a: unknown[]) => mockGetAvailable(...a),
    getCurrentForDriver: (...a: unknown[]) => mockGetCurrentForDriver(...a),
    accept:              (...a: unknown[]) => mockAccept(...a),
    complete:            (...a: unknown[]) => mockComplete(...a),
  },
}))

const m1 = { id: 'm1', status: 'AVAILABLE', type: 'CPAM',  departure: 'Paris', destination: 'Lyon',  price_eur: 50, driver_id: null }
const m2 = { id: 'm2', status: 'AVAILABLE', type: 'PRIVE', departure: 'Lille', destination: 'Reims', price_eur: 30, driver_id: null }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetAvailable.mockResolvedValue([m1, m2])
  mockGetCurrentForDriver.mockResolvedValue(null)
  mockAccept.mockResolvedValue(undefined)
  mockComplete.mockResolvedValue(undefined)
})

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('useDriverMissions — chargement', () => {
  it('charge les missions disponibles au montage', async () => {
    const { result } = renderHook(() => useDriverMissions())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.missions).toEqual([m1, m2])
    expect(result.current.currentMission).toBeNull()
  })

  it('affiche une erreur si le chargement echoue', async () => {
    mockGetAvailable.mockRejectedValue(new Error('Reseau'))
    const { result } = renderHook(() => useDriverMissions())
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error).toBeTruthy()
  })
})

// ─── Filtre ───────────────────────────────────────────────────────────────────
describe('useDriverMissions — filtre', () => {
  it('ALL retourne toutes les missions', async () => {
    const { result } = renderHook(() => useDriverMissions())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.filtered).toHaveLength(2)
  })

  it('filtre par type CPAM', async () => {
    const { result } = renderHook(() => useDriverMissions())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.setFilter('CPAM') })
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe('m1')
  })
})

// ─── acceptMission ────────────────────────────────────────────────────────────
describe('useDriverMissions — acceptMission', () => {
  it('appelle missionService.accept avec les bons params', async () => {
    const { result } = renderHook(() => useDriverMissions())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.acceptMission('m1') })
    expect(mockAccept).toHaveBeenCalledWith('m1', 'drv-1')
  })
})

// ─── completeMission ──────────────────────────────────────────────────────────
describe('useDriverMissions — completeMission', () => {
  it('remet currentMission a null apres completion', async () => {
    mockGetCurrentForDriver.mockResolvedValueOnce({ id: 'm1' })
    mockGetCurrentForDriver.mockResolvedValue(null)
    const { result } = renderHook(() => useDriverMissions())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.completeMission('m1') })
    expect(result.current.currentMission).toBeNull()
    expect(mockComplete).toHaveBeenCalledWith('m1')
  })
})
