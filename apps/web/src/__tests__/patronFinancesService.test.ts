import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { patronFinancesService } from '@/services/patronFinancesService'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-05-09T15:00:00.000Z'))
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

function chain(finalResult: { data: unknown; error?: unknown }) {
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

describe('patronFinancesService.getFinances', () => {
  it('compose les KPIs revenus + breakdown CPAM/PRIVE + buckets 30j', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({ // allRes (total tout temps)
        data: [{ price_eur: 100 }, { price_eur: 50 }, { price_eur: 25 }],
      })
      if (call === 2) return chain({ // monthRes
        data: [
          { price_eur: 40, type: 'CPAM' },
          { price_eur: 30, type: 'CPAM' },
          { price_eur: 20, type: 'PRIVE' },
        ],
      })
      if (call === 3) return chain({ // weekRes
        data: [{ price_eur: 50 }, { price_eur: 30 }],
      })
      if (call === 4) return chain({ // lastRes (30j)
        data: [
          { completed_at: '2026-05-09T09:00:00Z', price_eur: 25 }, // aujourd'hui
          { completed_at: '2026-05-08T09:00:00Z', price_eur: 18 }, // hier
          { completed_at: '2026-04-15T09:00:00Z', price_eur: 30 }, // J-24
        ],
      })
      throw new Error(`Unexpected call ${call}`)
    })

    const result = await patronFinancesService.getFinances('org-1')

    expect(result.totalRevenue).toBe(175)
    expect(result.monthRevenue).toBe(90)
    expect(result.cpamRevenue).toBe(70)
    expect(result.privateRevenue).toBe(20)
    expect(result.weekRevenue).toBe(80)
    expect(result.revenueLast30Days).toHaveLength(30)
    expect(result.revenueLast30Days[29]).toBe(25) // aujourd'hui
    expect(result.revenueLast30Days[28]).toBe(18) // hier
    expect(result.revenueLast30Days[5]).toBe(30) // J-24
  })

  it('retourne tout a 0 si aucune mission', async () => {
    mockFrom.mockReturnValue(chain({ data: [] }))
    const result = await patronFinancesService.getFinances('org-1')
    expect(result.totalRevenue).toBe(0)
    expect(result.monthRevenue).toBe(0)
    expect(result.cpamRevenue).toBe(0)
    expect(result.privateRevenue).toBe(0)
    expect(result.weekRevenue).toBe(0)
    expect(result.revenueLast30Days.every((v) => v === 0)).toBe(true)
  })
})

describe('patronFinancesService.getRecentCpamMissions', () => {
  it('jette si la requete echoue', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'denied' } }))
    await expect(patronFinancesService.getRecentCpamMissions('org-1')).rejects.toThrow('denied')
  })

  it('retourne tableau vide si aucune mission CPAM completee', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }))
    const result = await patronFinancesService.getRecentCpamMissions('org-1')
    expect(result).toEqual([])
  })

  it('compose les missions CPAM avec driver_name initial. nom et paid=false', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (call === 1 && table === 'missions') return chain({
        data: [
          { id: 'm-1', type: 'CPAM', scheduled_at: '2026-05-08T09:00:00Z',
            price_eur: 35, patient_name: 'Marie D.', driver_id: 'd-1' },
          { id: 'm-2', type: 'CPAM', scheduled_at: '2026-05-08T11:00:00Z',
            price_eur: 22, patient_name: 'Jean L.', driver_id: null },
        ],
        error: null,
      })
      if (call === 2 && table === 'profiles') return chain({
        data: [{ id: 'd-1', first_name: 'Alice', last_name: 'Martin' }],
        error: null,
      })
      throw new Error(`Unexpected: ${table}`)
    })

    const result = await patronFinancesService.getRecentCpamMissions('org-1')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(expect.objectContaining({
      id: 'm-1', type: 'CPAM', driver_name: 'A. Martin',
      patient_name: 'Marie D.', price_eur: 35, paid: false,
    }))
    expect(result[1]).toEqual(expect.objectContaining({
      id: 'm-2', driver_name: '—',
    }))
  })
})
