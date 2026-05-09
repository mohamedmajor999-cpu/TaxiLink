import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { patronMarketplaceService } from '@/services/patronMarketplaceService'

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

describe('patronMarketplaceService.getMarketplace', () => {
  it('retourne tableau vide si aucune mission ni groupe', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (call === 1 && table === 'group_members') return chain({ data: [] })
      if (call === 2 && table === 'missions') return chain({ data: [] })
      throw new Error(`Unexpected ${table} call ${call}`)
    })
    const result = await patronMarketplaceService.getMarketplace('d-1')
    expect(result).toEqual([])
  })

  it('compose missions PUBLIC + GROUP, deduplique, enrichit shared_by_name et group_names', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (table === 'group_members') return chain({
        data: [{ group_id: 'g-1' }, { group_id: 'g-2' }],
      })
      if (call === 2 && table === 'missions') return chain({
        data: [
          { id: 'm-pub', type: 'PRIVE', scheduled_at: '2026-05-09T11:00:00Z',
            departure: 'Hopital, Marseille', destination: 'Domicile, Marseille',
            price_eur: 25, patient_name: 'Marie D.', visibility: 'PUBLIC',
            shared_by: 'driver-A', status: 'AVAILABLE' },
        ],
      })
      if (call === 3 && table === 'mission_groups') return chain({
        data: [
          { mission_id: 'm-grp', missions: {
              id: 'm-grp', type: 'CPAM', scheduled_at: '2026-05-09T12:00:00Z',
              departure: 'X', destination: 'Y', price_eur: 30, patient_name: null,
              visibility: 'GROUP', shared_by: 'driver-B', status: 'AVAILABLE' } },
          { mission_id: 'm-pub', missions: { // doublon avec PUBLIC, doit etre dedupliqu
              id: 'm-pub', type: 'PRIVE', scheduled_at: '2026-05-09T11:00:00Z',
              departure: 'Hopital, Marseille', destination: 'Domicile, Marseille',
              price_eur: 25, patient_name: 'Marie D.', visibility: 'PUBLIC',
              shared_by: 'driver-A', status: 'AVAILABLE' } },
        ],
      })
      if (call === 4 && table === 'profiles') return chain({
        data: [
          { id: 'driver-A', first_name: 'Alice', last_name: 'Martin' },
          { id: 'driver-B', first_name: 'Bob', last_name: 'Smith' },
        ],
      })
      if (call === 5 && table === 'mission_groups') return chain({
        data: [
          { mission_id: 'm-grp', groups: { name: 'Equipe Marseille' } },
          { mission_id: 'm-grp', groups: { name: 'CPAM 13' } },
        ],
      })
      throw new Error(`Unexpected ${table} call ${call}`)
    })

    const result = await patronMarketplaceService.getMarketplace('d-1')

    expect(result).toHaveLength(2)
    // Tri ASC sur scheduled_at
    expect(result[0].id).toBe('m-pub')
    expect(result[1].id).toBe('m-grp')
    expect(result[0]).toEqual(expect.objectContaining({
      shared_by_name: 'A. Martin',
      group_names: [],
      visibility: 'PUBLIC',
    }))
    expect(result[1]).toEqual(expect.objectContaining({
      shared_by_name: 'B. Smith',
      group_names: ['Equipe Marseille', 'CPAM 13'],
      visibility: 'GROUP',
    }))
  })

  it('filtre les missions GROUP non AVAILABLE ou passees', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (table === 'group_members') return chain({ data: [{ group_id: 'g-1' }] })
      if (call === 2 && table === 'missions') return chain({ data: [] })
      if (call === 3 && table === 'mission_groups') return chain({
        data: [
          { mission_id: 'm-old', missions: {
              id: 'm-old', type: 'CPAM', scheduled_at: '2026-05-09T08:00:00Z', // passe
              departure: 'X', destination: 'Y', price_eur: 20, patient_name: null,
              visibility: 'GROUP', shared_by: 'd-X', status: 'AVAILABLE' } },
          { mission_id: 'm-taken', missions: {
              id: 'm-taken', type: 'CPAM', scheduled_at: '2026-05-09T15:00:00Z',
              departure: 'X', destination: 'Y', price_eur: 20, patient_name: null,
              visibility: 'GROUP', shared_by: 'd-X', status: 'IN_PROGRESS' } },
        ],
      })
      return chain({ data: [] })
    })
    const result = await patronMarketplaceService.getMarketplace('d-1')
    expect(result).toEqual([])
  })

  it('shared_by_name = "Client" si shared_by est null', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (table === 'group_members') return chain({ data: [] })
      if (call === 2 && table === 'missions') return chain({
        data: [{
          id: 'm-client', type: 'CPAM', scheduled_at: '2026-05-09T11:00:00Z',
          departure: 'A', destination: 'B', price_eur: 20, patient_name: null,
          visibility: 'PUBLIC', shared_by: null, status: 'AVAILABLE',
        }],
      })
      if (call === 3 && table === 'mission_groups') return chain({ data: [] })
      throw new Error(`Unexpected ${table} call ${call}`)
    })
    const result = await patronMarketplaceService.getMarketplace('d-1')
    expect(result).toHaveLength(1)
    expect(result[0].shared_by_name).toBe('Client')
  })

  it('formatte scheduled_label en "Dans Xmin" / "Dans Xh" / date longue', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (table === 'group_members') return chain({ data: [] })
      if (call === 2 && table === 'missions') return chain({
        data: [
          { id: 'soon', type: 'PRIVE', scheduled_at: '2026-05-09T10:30:00Z', // +30 min
            departure: 'A', destination: 'B', price_eur: 10, patient_name: null,
            visibility: 'PUBLIC', shared_by: null, status: 'AVAILABLE' },
          { id: 'later', type: 'PRIVE', scheduled_at: '2026-05-09T18:00:00Z', // +8h
            departure: 'A', destination: 'B', price_eur: 10, patient_name: null,
            visibility: 'PUBLIC', shared_by: null, status: 'AVAILABLE' },
        ],
      })
      if (call === 3 && table === 'mission_groups') return chain({ data: [] })
      throw new Error(`Unexpected ${table} call ${call}`)
    })
    const result = await patronMarketplaceService.getMarketplace('d-1')
    expect(result[0].scheduled_label).toMatch(/^Dans 30 min$/)
    expect(result[1].scheduled_label).toMatch(/^Dans 8h$/)
  })
})
