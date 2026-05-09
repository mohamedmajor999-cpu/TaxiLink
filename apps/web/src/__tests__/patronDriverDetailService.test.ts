import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { patronDriverDetailService } from '@/services/patronDriverDetailService'

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

describe('patronDriverDetailService.getDriverDetail', () => {
  it('retourne null si le driver n existe pas', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'drivers') return chain({ data: null })
      return chain({ data: null })
    })
    const result = await patronDriverDetailService.getDriverDetail('d-unknown')
    expect(result).toBeNull()
  })

  it('compose le detail driver avec name, initials, documents et stats du mois', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'drivers') return chain({
        data: { id: 'd1', is_online: true, vehicle_model: 'Model 3', vehicle_plate: 'AB-12-CD',
          rating: 4.8, total_rides: 120, cpam_enabled: true, is_verified: true },
      })
      if (table === 'profiles') return chain({
        data: { first_name: 'Alice', last_name: 'Martin', phone: '0612345678' },
      })
      if (table === 'driver_documents') return chain({
        data: [
          { id: 'doc-1', label: 'Carte VTC', type: 'license', status: 'active', expiry_date: '2026-05-19' },
          { id: 'doc-2', label: 'Assurance', type: 'insurance', status: 'active', expiry_date: null },
        ],
      })
      if (table === 'missions') return chain({
        data: [
          { price_eur: 25, completed_at: '2026-05-02T10:00:00Z' },
          { price_eur: 18, completed_at: '2026-05-05T10:00:00Z' },
        ],
      })
      throw new Error(`Unexpected: ${table}`)
    })

    const result = await patronDriverDetailService.getDriverDetail('d1')

    expect(result).not.toBeNull()
    expect(result).toEqual(expect.objectContaining({
      id: 'd1',
      name: 'Alice Martin',
      initials: 'AM',
      phone: '0612345678',
      is_online: true,
      vehicle_model: 'Model 3',
      vehicle_plate: 'AB-12-CD',
      rating: 4.8,
      total_rides: 120,
      cpam_enabled: true,
      is_verified: true,
      monthMissions: 2,
      monthRevenue: 43,
    }))
    expect(result!.documents).toHaveLength(2)
    expect(result!.documents[0]).toEqual(expect.objectContaining({ id: 'doc-1', label: 'Carte VTC' }))
    expect(result!.documents[0].daysLeft).toBeGreaterThanOrEqual(9)
    expect(result!.documents[0].daysLeft).toBeLessThanOrEqual(11)
    expect(result!.documents[1].daysLeft).toBeNull()
  })

  it('fallback "Chauffeur" + "??" si profile null', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'drivers') return chain({
        data: { id: 'd2', is_online: false, vehicle_model: null, vehicle_plate: null,
          rating: 0, total_rides: 0, cpam_enabled: false, is_verified: false },
      })
      if (table === 'profiles') return chain({ data: null })
      if (table === 'driver_documents') return chain({ data: [] })
      if (table === 'missions') return chain({ data: [] })
      throw new Error(`Unexpected: ${table}`)
    })
    const result = await patronDriverDetailService.getDriverDetail('d2')
    expect(result).toEqual(expect.objectContaining({
      name: 'Chauffeur',
      initials: '??',
      phone: null,
      monthMissions: 0,
      monthRevenue: 0,
    }))
  })

  it('ignore les missions price_eur null dans le calcul du CA', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'drivers') return chain({
        data: { id: 'd3', is_online: true, vehicle_model: null, vehicle_plate: null,
          rating: 0, total_rides: 0, cpam_enabled: false, is_verified: false },
      })
      if (table === 'profiles') return chain({ data: { first_name: 'Bob', last_name: 'Smith', phone: null } })
      if (table === 'driver_documents') return chain({ data: [] })
      if (table === 'missions') return chain({
        data: [
          { price_eur: 30, completed_at: '2026-05-03T10:00:00Z' },
          { price_eur: null, completed_at: '2026-05-04T10:00:00Z' },
        ],
      })
      throw new Error(`Unexpected: ${table}`)
    })
    const result = await patronDriverDetailService.getDriverDetail('d3')
    expect(result!.monthMissions).toBe(2)
    expect(result!.monthRevenue).toBe(30)
  })
})
