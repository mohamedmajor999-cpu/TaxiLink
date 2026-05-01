import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCoursesEarningsChip } from '@/components/dashboard/driver/courses/useCoursesEarningsChip'

const mockGetDailyStats = vi.fn()

vi.mock('@/services/earningsService', () => ({
  earningsService: { getDailyStats: (...a: unknown[]) => mockGetDailyStats(...a) },
}))

vi.mock('@/store/driverStore', () => ({
  useDriverStore: <T,>(selector: (s: unknown) => T) =>
    selector({ driver: { id: 'd1' } } as unknown),
}))

vi.mock('@/store/postedAcceptStore', () => ({
  useUnseenAcceptCount: vi.fn(() => 0),
}))

import { useUnseenAcceptCount } from '@/store/postedAcceptStore'
const mockUnseenCount = vi.mocked(useUnseenAcceptCount)

beforeEach(() => {
  vi.clearAllMocks()
  mockUnseenCount.mockReturnValue(0)
  mockGetDailyStats.mockResolvedValue({
    todayEarnings: 184,
    todayCount: 4,
    yesterdayEarnings: 150,
    weekSparkline: [
      { date: '2026-04-26', earnings: 100 },
      { date: '2026-04-27', earnings: 120 },
      { date: '2026-04-28', earnings: 90 },
      { date: '2026-04-29', earnings: 200 },
      { date: '2026-04-30', earnings: 150 },
      { date: '2026-05-01', earnings: 180 },
      { date: '2026-05-02', earnings: 184 },
    ],
  })
})

describe('useCoursesEarningsChip — variant today', () => {
  it("renvoie le total d'aujourd'hui en EUR", async () => {
    const { result } = renderHook(() => useCoursesEarningsChip('today'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.amount).toBe(184)
    expect(result.current.unit).toBe('eur')
    expect(result.current.label).toBe("aujourd'hui")
  })
})

describe('useCoursesEarningsChip — variant week', () => {
  it('somme la sparkline de la semaine', async () => {
    const { result } = renderHook(() => useCoursesEarningsChip('week'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.amount).toBe(100 + 120 + 90 + 200 + 150 + 180 + 184)
    expect(result.current.unit).toBe('eur')
  })
})

describe('useCoursesEarningsChip — variant pendingAds', () => {
  it("renvoie le compte d'annonces non vues, en unit count", () => {
    mockUnseenCount.mockReturnValue(3)
    const { result } = renderHook(() => useCoursesEarningsChip('pendingAds'))
    expect(result.current.amount).toBe(3)
    expect(result.current.unit).toBe('count')
    expect(result.current.loading).toBe(false)
  })

  it("ne déclenche pas l'appel earningsService", () => {
    renderHook(() => useCoursesEarningsChip('pendingAds'))
    expect(mockGetDailyStats).not.toHaveBeenCalled()
  })
})
