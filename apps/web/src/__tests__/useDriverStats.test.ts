import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDriverStats } from '@/components/dashboard/driver/useDriverStats'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetDone = vi.fn()

const mockUser = { id: 'drv-1' }
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/services/missionService', () => ({
  missionService: { getDoneByDriver: (...a: unknown[]) => mockGetDone(...a) },
}))

vi.mock('@/lib/utils', () => ({
  isSameMonth: (d1: Date, d2: Date) => d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear(),
}))

vi.mock('@/lib/statsUtils', () => ({
  computeStats: (missions: any[]) => ({
    rides:    missions.length,
    km:       0,
    earnings: missions.reduce((s: number, m: any) => s + (m.price_eur ?? 0), 0),
  }),
}))

const now = new Date()
const todayStr = now.toDateString()

const fakeMissions = [
  { id: 'm1', type: 'CPAM',     price_eur: 30, completed_at: now.toISOString(), scheduled_at: now.toISOString() },
  { id: 'm2', type: 'PRIVE',    price_eur: 50, completed_at: now.toISOString(), scheduled_at: now.toISOString() },
  { id: 'm3', type: 'TAXILINK', price_eur: 20, completed_at: new Date(now.getFullYear() - 1, 0, 1).toISOString(), scheduled_at: new Date(now.getFullYear() - 1, 0, 1).toISOString() },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockGetDone.mockResolvedValue(fakeMissions)
})

// ─── Chargement ───────────────────────────────────────────────────────────────
describe('useDriverStats — chargement', () => {
  it('charge les missions au montage', async () => {
    const { result } = renderHook(() => useDriverStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.missions).toEqual(fakeMissions)
    expect(mockGetDone).toHaveBeenCalledWith('drv-1')
  })

  it('affiche une erreur si le chargement echoue', async () => {
    mockGetDone.mockRejectedValue(new Error('Reseau indisponible'))
    const { result } = renderHook(() => useDriverStats())
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error).toBe('Reseau indisponible')
  })
})

// ─── Periods ──────────────────────────────────────────────────────────────────
describe('useDriverStats — calcul des périodes', () => {
  it('expose trois periodes : aujourd hui, ce mois, total', async () => {
    const { result } = renderHook(() => useDriverStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.periods).toHaveLength(3)
    expect(result.current.periods[0].label).toBe("Aujourd'hui")
    expect(result.current.periods[2].label).toBe('Total')
  })

  it('comptabilise les missions du jour correctement', async () => {
    const { result } = renderHook(() => useDriverStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    // m1 et m2 sont aujourd'hui, m3 est l'an dernier
    expect(result.current.periods[0].rides).toBe(2)
    expect(result.current.periods[0].earnings).toBe(80)
  })

  it('comptabilise toutes les missions dans le total', async () => {
    const { result } = renderHook(() => useDriverStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.periods[2].rides).toBe(3)
    expect(result.current.periods[2].earnings).toBe(100)
  })
})

// ─── byType ───────────────────────────────────────────────────────────────────
describe('useDriverStats — répartition par type', () => {
  it('groupe les missions par type avec count et earnings', async () => {
    const { result } = renderHook(() => useDriverStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const cpam = result.current.byType.find((t) => t.type === 'CPAM')!
    expect(cpam.count).toBe(1)
    expect(cpam.earnings).toBe(30)
  })
})
