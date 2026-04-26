import { describe, it, expect, vi, beforeEach } from 'vitest'
import { earningsService } from '@/services/earningsService'

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

function chain(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data, error }),
  }
}

beforeEach(() => {
  mockFrom.mockReset()
})

// Construit des dates en local time pour matcher la logique du service
const localDate = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min, 0).toISOString()

describe('earningsService.getDailyStats', () => {
  it('agrege les revenus du jour, hier, et la sparkline 7j', async () => {
    const now = new Date(2026, 3, 26, 15, 0)
    mockFrom.mockReturnValueOnce(chain([
      { completed_at: localDate(2026, 4, 26, 10), price_eur: 30 },
      { completed_at: localDate(2026, 4, 26, 14), price_eur: 25 },
      { completed_at: localDate(2026, 4, 25, 11), price_eur: 20 },
      { completed_at: localDate(2026, 4, 25, 16), price_eur: 30 },
      { completed_at: localDate(2026, 4, 21, 8),  price_eur: 18 },
    ]))

    const stats = await earningsService.getDailyStats('drv-1', now)

    expect(stats.todayEarnings).toBe(55)
    expect(stats.todayCount).toBe(2)
    expect(stats.yesterdayEarnings).toBe(50)
    expect(stats.weekSparkline).toHaveLength(7)
    const todayBucket = stats.weekSparkline.find((d) => d.date === '2026-04-26')!
    expect(todayBucket.earnings).toBe(55)
    expect(todayBucket.count).toBe(2)
    const yesterdayBucket = stats.weekSparkline.find((d) => d.date === '2026-04-25')!
    expect(yesterdayBucket.earnings).toBe(50)
  })

  it('renvoie zero partout si aucune mission completee', async () => {
    mockFrom.mockReturnValueOnce(chain([]))
    const stats = await earningsService.getDailyStats('drv-1', new Date(2026, 3, 26, 12, 0))
    expect(stats.todayEarnings).toBe(0)
    expect(stats.todayCount).toBe(0)
    expect(stats.yesterdayEarnings).toBe(0)
    expect(stats.weekSparkline.every((d) => d.earnings === 0 && d.count === 0)).toBe(true)
  })

  it('jette une Error si Supabase retourne une erreur', async () => {
    mockFrom.mockReturnValueOnce(chain(null, { message: 'boom' }))
    await expect(earningsService.getDailyStats('drv-1', new Date(2026, 3, 26, 12, 0)))
      .rejects.toThrow('boom')
  })
})
