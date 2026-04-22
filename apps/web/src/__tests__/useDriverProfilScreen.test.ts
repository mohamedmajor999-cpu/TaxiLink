import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockDriver = { id: 'd1', name: 'Jean Dupont', email: 'jean@test.fr', cpamEnabled: true, rating: 4.8, totalRides: 120, isOnline: false, createdAt: '2024-01-01' }

vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn((sel: (s: { driver: typeof mockDriver }) => unknown) =>
    sel ? sel({ driver: mockDriver }) : { driver: mockDriver }
  ),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'jean@test.fr' } }),
}))

const mockMissions = [
  { scheduled_at: new Date().toISOString(), completed_at: null, price_eur: 50 },
  { scheduled_at: new Date().toISOString(), completed_at: null, price_eur: 30 },
]
vi.mock('@/components/dashboard/driver/useDriverStats', () => ({
  useDriverStats: () => ({ missions: mockMissions, loading: false }),
}))

const mockGetDriver = vi.fn()
vi.mock('@/services/driverService', () => ({
  driverService: { getDriver: (...a: unknown[]) => mockGetDriver(...a) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetDriver.mockResolvedValue({ pro_number: 'PRO-123', is_verified: true })
})

describe('useDriverProfilScreen', () => {
  it('retourne les initiales correctes', async () => {
    const { useDriverProfilScreen } = await import('@/components/dashboard/driver/profil/useDriverProfilScreen')
    const { result } = renderHook(() => useDriverProfilScreen('Jean Dupont'))
    expect(result.current.initials).toBe('JD')
  })

  it('fullName = driverName passé en paramètre', async () => {
    const { useDriverProfilScreen } = await import('@/components/dashboard/driver/profil/useDriverProfilScreen')
    const { result } = renderHook(() => useDriverProfilScreen('Marie Martin'))
    expect(result.current.fullName).toBe('Marie Martin')
  })

  it("fullName = 'Chauffeur' si driverName vide", async () => {
    const { useDriverProfilScreen } = await import('@/components/dashboard/driver/profil/useDriverProfilScreen')
    const { result } = renderHook(() => useDriverProfilScreen(''))
    expect(result.current.fullName).toBe('Chauffeur')
  })

  it('charge proNumber et isVerified depuis driverService', async () => {
    const { useDriverProfilScreen } = await import('@/components/dashboard/driver/profil/useDriverProfilScreen')
    const { result } = renderHook(() => useDriverProfilScreen('Jean Dupont'))
    await waitFor(() => expect(result.current.proNumber).toBe('PRO-123'))
    expect(result.current.isVerified).toBe(true)
  })

  it('monthlyStats.revenue = somme des missions du mois courant', async () => {
    const { useDriverProfilScreen } = await import('@/components/dashboard/driver/profil/useDriverProfilScreen')
    const { result } = renderHook(() => useDriverProfilScreen('Jean Dupont'))
    expect(result.current.monthlyStats.revenue).toBe(80)
    expect(result.current.monthlyStats.courseCount).toBe(2)
  })
})
