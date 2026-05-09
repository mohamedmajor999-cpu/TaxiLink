import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { patronOverviewService } from '@/services/patronOverviewService'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-05-09T10:00:00.000Z'))
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

function chain(finalResult: { data?: unknown; count?: number | null; error?: unknown }) {
  const terminal: Record<string, ReturnType<typeof vi.fn>> = {}
  const handler: ProxyHandler<typeof terminal> = {
    get(target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(finalResult).then(resolve)
      }
      if (!target[prop]) {
        target[prop] = vi.fn().mockReturnValue(new Proxy(terminal, handler))
      }
      return target[prop]
    },
  }
  return new Proxy(terminal, handler)
}

describe('patronOverviewService.getKPIs', () => {
  it('compose les KPIs : drivers count, missions actives, revenu jour/hier, alertes docs', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({ count: 12 }) // drivers total
      if (call === 2) return chain({ count: 5 }) // online
      if (call === 3) return chain({ count: 3 }) // active missions IN_PROGRESS
      if (call === 4) return chain({
        data: [
          { completed_at: '2026-05-09T09:00:00Z', price_eur: 50 }, // aujourd'hui
          { completed_at: '2026-05-09T08:00:00Z', price_eur: 25 }, // aujourd'hui
          { completed_at: '2026-05-08T09:00:00Z', price_eur: 30 }, // hier
          { completed_at: '2026-05-04T09:00:00Z', price_eur: 40 }, // J-5
        ],
      })
      if (call === 5) return chain({ count: 2 }) // docs expirant
      throw new Error(`Unexpected call ${call}`)
    })

    const result = await patronOverviewService.getKPIs('org-1')

    expect(result.driversTotal).toBe(12)
    expect(result.driversOnline).toBe(5)
    expect(result.activeMissions).toBe(3)
    expect(result.alerts).toBe(2)
    expect(result.todayRevenue).toBe(75)
    expect(result.yesterdayRevenue).toBe(30)
    expect(result.revenueLast7Days).toHaveLength(7)
    expect(result.revenueLast7Days[6]).toBe(75) // d-0
    expect(result.revenueLast7Days[5]).toBe(30) // d-1
    expect(result.revenueLast7Days[1]).toBe(40) // d-5
  })

  it('retourne 0 partout si aucune donnee + count null', async () => {
    mockFrom.mockReturnValue(chain({ count: null, data: [] }))
    const result = await patronOverviewService.getKPIs('org-1')
    expect(result.driversTotal).toBe(0)
    expect(result.driversOnline).toBe(0)
    expect(result.activeMissions).toBe(0)
    expect(result.alerts).toBe(0)
    expect(result.todayRevenue).toBe(0)
    expect(result.yesterdayRevenue).toBe(0)
    expect(result.revenueLast7Days.every((v) => v === 0)).toBe(true)
  })
})

describe('patronOverviewService.getRecentActivity', () => {
  it('jette si la requete echoue', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'denied' } }))
    await expect(patronOverviewService.getRecentActivity('org-1')).rejects.toThrow('denied')
  })

  it('mappe sur type=accept ou complete selon completed_at + tronque addresses', async () => {
    mockFrom.mockReturnValue(chain({
      data: [
        { id: 'm-1', status: 'DONE', price_eur: 25,
          accepted_at: '2026-05-09T08:00:00Z', completed_at: '2026-05-09T09:30:00Z',
          departure: 'Hopital Timone, Marseille', destination: 'Domicile, Marseille' },
        { id: 'm-2', status: 'IN_PROGRESS', price_eur: 30,
          accepted_at: '2026-05-09T09:45:00Z', completed_at: null,
          departure: 'Gare Saint-Charles', destination: 'Aeroport' },
      ],
      error: null,
    }))
    const result = await patronOverviewService.getRecentActivity('org-1')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(expect.objectContaining({
      id: 'm-1', type: 'complete', from: 'Hopital Timone', to: 'Domicile', price: 25,
    }))
    expect(result[1]).toEqual(expect.objectContaining({
      id: 'm-2', type: 'accept', from: 'Gare Saint-Charles', to: 'Aeroport',
    }))
    // time HH:MM toujours present
    expect(result[0].time).toMatch(/^\d{2}:\d{2}$/)
    expect(result[1].time).toMatch(/^\d{2}:\d{2}$/)
  })

  it('retourne tableau vide si data null', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }))
    const result = await patronOverviewService.getRecentActivity('org-1')
    expect(result).toEqual([])
  })
})
