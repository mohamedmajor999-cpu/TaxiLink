import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mockDriver = {
  id: 'd1', name: 'Jean Dupont', email: 'jean@test.fr', phone: '0612345678',
  cpamEnabled: true, rating: 4.8, totalRides: 120, isOnline: false, createdAt: '2024-01-01',
}

vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn((sel?: (s: { driver: typeof mockDriver }) => unknown) =>
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

vi.mock('@/hooks/useDeptPreferences', () => ({
  useDeptPreferences: () => ({ depts: ['13', '84'], loading: false, save: vi.fn() }),
}))

const mockGetDriver = vi.fn()
const mockGetDocuments = vi.fn()
vi.mock('@/services/driverService', () => ({
  driverService: { getDriver: (...a: unknown[]) => mockGetDriver(...a) },
}))
vi.mock('@/services/documentService', () => ({
  documentService: { getDocuments: (...a: unknown[]) => mockGetDocuments(...a) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetDriver.mockResolvedValue({ pro_number: 'PRO-123', is_verified: true })
  mockGetDocuments.mockResolvedValue([])
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

  it('charge proNumber depuis driverService', async () => {
    const { useDriverProfilScreen } = await import('@/components/dashboard/driver/profil/useDriverProfilScreen')
    const { result } = renderHook(() => useDriverProfilScreen('Jean Dupont'))
    await waitFor(() => expect(result.current.proNumber).toBe('PRO-123'))
  })

  it('monthlyRevenue = somme des missions du mois courant', async () => {
    const { useDriverProfilScreen } = await import('@/components/dashboard/driver/profil/useDriverProfilScreen')
    const { result } = renderHook(() => useDriverProfilScreen('Jean Dupont'))
    expect(result.current.monthlyRevenue).toBe(80)
    expect(result.current.courseCount).toBe(2)
  })

  it('expose departements et déduit la ville depuis le département principal', async () => {
    const { useDriverProfilScreen } = await import('@/components/dashboard/driver/profil/useDriverProfilScreen')
    const { result } = renderHook(() => useDriverProfilScreen('Jean Dupont'))
    expect(result.current.departements).toEqual(['13', '84'])
    expect(result.current.mainDepartement).toBe('13')
    expect(result.current.city).toBe('Marseille')
  })

  it("documentsWarning indique le nombre de documents à renouveler", async () => {
    mockGetDocuments.mockResolvedValue([])
    const { useDriverProfilScreen } = await import('@/components/dashboard/driver/profil/useDriverProfilScreen')
    const { result } = renderHook(() => useDriverProfilScreen('Jean Dupont'))
    await waitFor(() => expect(result.current.documentsWarning).toMatch(/document/))
  })
})
