import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { patronFleetService } from '@/services/patronFleetService'

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

function chain(finalResult: { data: unknown; error: unknown }) {
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

describe('patronFleetService.getFleetPositions', () => {
  it('retourne tableau vide si aucun driver', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }))
    const result = await patronFleetService.getFleetPositions('org-1')
    expect(result).toEqual([])
  })

  it('jette si la requete drivers echoue', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'denied' } }))
    await expect(patronFleetService.getFleetPositions('org-1')).rejects.toThrow('denied')
  })

  it('compose drivers avec stats today + status (in-mission|online|offline) + initiales', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (call === 1 && table === 'drivers') return chain({
        data: [
          { id: 'd1', is_online: true,  vehicle_plate: 'AB-12-CD', current_lat: 43.3, current_lng: 5.4, rating: 4.8 },
          { id: 'd2', is_online: false, vehicle_plate: null,        current_lat: null, current_lng: null, rating: 4.2 },
          { id: 'd3', is_online: true,  vehicle_plate: 'EF-34-GH', current_lat: 43.31, current_lng: 5.41, rating: 4.5 },
        ],
        error: null,
      })
      if (call === 2 && table === 'profiles') return chain({
        data: [
          { id: 'd1', first_name: 'Alice', last_name: 'Martin' },
          { id: 'd2', first_name: 'Bob',   last_name: 'Smith' },
          { id: 'd3', first_name: null,    last_name: null },
        ],
        error: null,
      })
      if (call === 3 && table === 'missions') return chain({
        data: [
          { driver_id: 'd1', status: 'DONE',        price_eur: 25, completed_at: '2026-05-09T10:00:00Z' },
          { driver_id: 'd1', status: 'DONE',        price_eur: 18, completed_at: '2026-05-09T12:00:00Z' },
          { driver_id: 'd3', status: 'IN_PROGRESS', price_eur: 30, completed_at: null },
        ],
        error: null,
      })
      throw new Error(`Unexpected: ${table}`)
    })

    const result = await patronFleetService.getFleetPositions('org-1')

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual(expect.objectContaining({
      id: 'd1', name: 'Alice Martin', initials: 'AM',
      status: 'online', vehicle: 'AB-12-CD',
      lat: 43.3, lng: 5.4, todayMissions: 2, todayRevenue: 43, rating: 4.8,
    }))
    expect(result[1]).toEqual(expect.objectContaining({
      id: 'd2', name: 'Bob Smith', initials: 'BS',
      status: 'offline', vehicle: null, lat: null, lng: null,
      todayMissions: 0, todayRevenue: 0,
    }))
    expect(result[2]).toEqual(expect.objectContaining({
      id: 'd3', name: 'Chauffeur', initials: '??',
      status: 'in-mission',
    }))
  })
})

describe('patronFleetService.getDocAlerts', () => {
  it('retourne tableau vide si aucun document expirant bientot', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }))
    const result = await patronFleetService.getDocAlerts('org-1')
    expect(result).toEqual([])
  })

  it('compose les alertes avec daysLeft calcule a partir de expiry_date', async () => {
    mockFrom.mockReturnValue(chain({
      data: [
        { id: 'doc-1', label: 'Carte VTC', expiry_date: '2026-05-19',
          drivers: { profiles: { first_name: 'Alice', last_name: 'Martin' } } },
        { id: 'doc-2', label: 'Assurance', expiry_date: '2026-06-08',
          drivers: { profiles: { first_name: null, last_name: null } } },
      ],
      error: null,
    }))
    const result = await patronFleetService.getDocAlerts('org-1', 60)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(expect.objectContaining({ id: 'doc-1', driver: 'Alice Martin', doc: 'Carte VTC' }))
    expect(result[0].daysLeft).toBeGreaterThanOrEqual(9)
    expect(result[0].daysLeft).toBeLessThanOrEqual(11)
    expect(result[1].driver).toBe('Chauffeur')
  })

  it('jette si la requete echoue', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'denied' } }))
    await expect(patronFleetService.getDocAlerts('org-1')).rejects.toThrow('denied')
  })
})
