import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDriverStats } from '@/components/dashboard/driver/useDriverStats'

const mockGetDone = vi.fn()
const mockUser = { id: 'drv-1' }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/services/missionService', () => ({
  missionService: { getDoneByDriver: (...a: unknown[]) => mockGetDone(...a) },
}))

const fakeMissions = [
  { id: 'm1', type: 'CPAM',  price_eur: 30 },
  { id: 'm2', type: 'PRIVE', price_eur: 50 },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockGetDone.mockResolvedValue(fakeMissions)
})

describe('useDriverStats', () => {
  it('charge les missions au montage', async () => {
    const { result } = renderHook(() => useDriverStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.missions).toEqual(fakeMissions)
    expect(mockGetDone).toHaveBeenCalledWith('drv-1')
  })

  it('expose une erreur si le chargement échoue', async () => {
    mockGetDone.mockRejectedValue(new Error('Reseau indisponible'))
    const { result } = renderHook(() => useDriverStats())
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error).toBe('Reseau indisponible')
  })
})
