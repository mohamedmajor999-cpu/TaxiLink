import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { groupActivityService } from '@/services/groupActivityService'

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

describe('groupActivityService.getRecentEvents', () => {
  it('jette si la requete mission_groups echoue', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'denied' } }))
    await expect(groupActivityService.getRecentEvents('g-1')).rejects.toThrow('denied')
  })

  it('retourne tableau vide si aucune mission dans le groupe', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }))
    const result = await groupActivityService.getRecentEvents('g-1')
    expect(result).toEqual([])
  })

  it('compose des events shared+accepted, tronque les adresses, label "Un confrère" si profil absent', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (call === 1 && table === 'mission_groups') return chain({
        data: [
          { missions: {
              id: 'm-1',
              departure: 'Hopital de la Timone, Marseille',
              destination: 'Cabinet Dr Smith, Aix-en-Provence',
              shared_by: 'driver-A',
              driver_id: 'driver-B',
              created_at: '2026-05-08T08:00:00Z',
              accepted_at: '2026-05-08T08:30:00Z',
          } },
          { missions: {
              id: 'm-2',
              departure: 'Gare Saint-Charles',
              destination: 'Aeroport',
              shared_by: 'driver-A',
              driver_id: null,
              created_at: '2026-05-09T07:00:00Z',
              accepted_at: null,
          } },
          { missions: null }, // ligne aberrante : doit etre ignoree
        ],
        error: null,
      })
      if (call === 2 && table === 'profiles') return chain({
        data: [{ id: 'driver-A', first_name: 'Alice', last_name: 'Martin' }],
        error: null,
      })
      throw new Error(`Unexpected: ${table}`)
    })

    const result = await groupActivityService.getRecentEvents('g-1', 10)

    expect(result).toHaveLength(3) // m-1 (shared+accepted) + m-2 (shared)
    // Tri DESC sur date : m-2 created (2026-05-09) > m-1 accepted (2026-05-08T08:30) > m-1 shared (2026-05-08T08:00)
    expect(result[0]).toEqual(expect.objectContaining({ id: 'm-2-share', kind: 'shared', driverLabel: 'Alice M.' }))
    expect(result[1]).toEqual(expect.objectContaining({ id: 'm-1-accept', kind: 'accepted', driverLabel: 'Un confrère' }))
    expect(result[2]).toEqual(expect.objectContaining({ id: 'm-1-share', kind: 'shared', driverLabel: 'Alice M.' }))
    // Adresse tronquee a 28 chars max + …
    expect(result[2].destination).toBe('Cabinet Dr Smith')
  })

  it('respecte le parametre limit (slice apres tri)', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({
        data: [
          { missions: { id: 'm-1', departure: 'A', destination: 'B', shared_by: 'd-1', driver_id: null, created_at: '2026-05-09T01:00:00Z', accepted_at: null } },
          { missions: { id: 'm-2', departure: 'C', destination: 'D', shared_by: 'd-1', driver_id: null, created_at: '2026-05-09T02:00:00Z', accepted_at: null } },
          { missions: { id: 'm-3', departure: 'E', destination: 'F', shared_by: 'd-1', driver_id: null, created_at: '2026-05-09T03:00:00Z', accepted_at: null } },
        ],
        error: null,
      })
      return chain({ data: [], error: null })
    })
    const result = await groupActivityService.getRecentEvents('g-1', 2)
    expect(result).toHaveLength(2)
    expect(result.map((e) => e.id)).toEqual(['m-3-share', 'm-2-share'])
  })
})

describe('groupActivityService.getGlobalPulse', () => {
  it('retourne 0/0 si liste de groupes vide', async () => {
    const result = await groupActivityService.getGlobalPulse([])
    expect(result).toEqual({ availableTotal: 0, onlineTotal: 0 })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('deduplique les chauffeurs et missions presents dans plusieurs groupes', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({
        data: [
          // d1 dans 2 groupes - online
          { driver_id: 'd1', drivers: { is_online: true, last_seen_at: '2026-05-09T09:59:00Z' } },
          { driver_id: 'd1', drivers: { is_online: true, last_seen_at: '2026-05-09T09:59:30Z' } },
          // d2 - online (last_seen_at il y a 60s, sous le TTL de 120s)
          { driver_id: 'd2', drivers: { is_online: true, last_seen_at: '2026-05-09T09:59:30Z' } },
          // d3 - offline (last_seen_at trop vieux)
          { driver_id: 'd3', drivers: { is_online: true, last_seen_at: '2026-05-09T08:00:00Z' } },
          // d4 - offline (is_online false)
          { driver_id: 'd4', drivers: { is_online: false, last_seen_at: '2026-05-09T09:59:00Z' } },
        ],
        error: null,
      })
      if (call === 2) return chain({
        data: [
          // m-A partagee dans 2 groupes
          { mission_id: 'm-A', missions: { status: 'OFFERED' } },
          { mission_id: 'm-A', missions: { status: 'OFFERED' } },
          // m-B
          { mission_id: 'm-B', missions: { status: 'OFFERED' } },
        ],
        error: null,
      })
      throw new Error(`Unexpected call ${call}`)
    })

    const result = await groupActivityService.getGlobalPulse(['g-1', 'g-2'])
    expect(result).toEqual({ availableTotal: 2, onlineTotal: 2 })
  })
})
