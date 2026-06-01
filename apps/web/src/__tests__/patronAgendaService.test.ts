import { describe, it, expect, vi, beforeEach } from 'vitest'
import { patronAgendaService } from '@/services/patronAgendaService'

const { mockFrom, mockRpc } = vi.hoisted(() => ({ mockFrom: vi.fn(), mockRpc: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Les courses dispo non assignees passent desormais par le RPC masque
  // get_org_unassigned_missions (SECURITY DEFINER) au lieu d'un SELECT direct.
  mockRpc.mockResolvedValue({ data: [], error: null })
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

describe('patronAgendaService.getDaySchedules', () => {
  it('retourne drivers et unassigned vides si aucun driver dans l org', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }))
    const result = await patronAgendaService.getDaySchedules('org-1')
    expect(result).toEqual({ drivers: [], unassigned: [] })
  })

  it('jette si la requete drivers echoue', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'denied' } }))
    await expect(patronAgendaService.getDaySchedules('org-1')).rejects.toThrow('denied')
  })

  it('compose les blocks par driver et la liste unassigned correctement', async () => {
    let call = 0
    mockFrom.mockImplementation((table: string) => {
      call++
      if (call === 1 && table === 'drivers') return chain({
        data: [
          { id: 'd1', profiles: { first_name: 'Alice', last_name: 'Martin' } },
          { id: 'd2', profiles: { first_name: 'Bob',   last_name: 'Smith' } },
        ],
        error: null,
      })
      if (call === 2 && table === 'missions') return chain({
        data: [
          { id: 'm1', driver_id: 'd1', scheduled_at: '2026-05-08T10:30:00Z', duration_min: 30,
            status: 'IN_PROGRESS', departure: 'Hopital Timone, Marseille', destination: 'Domicile, Marseille',
            type: 'CPAM', completed_at: null },
          { id: 'm2', driver_id: 'd2', scheduled_at: '2026-05-08T14:00:00Z', duration_min: 60,
            status: 'DONE', departure: 'A', destination: 'B', type: 'PRIVE', completed_at: '2026-05-08T15:00:00Z' },
        ],
        error: null,
      })
      throw new Error(`Unexpected: ${table} call ${call}`)
    })
    // Courses dispo non assignees via le RPC masque (lignes plates, PII org legitime)
    mockRpc.mockResolvedValue({
      data: [
        { id: 'u1', scheduled_at: '2026-05-08T16:00:00Z', duration_min: 45,
          departure: 'Cabinet Dr X', destination: 'Hopital Y', type: 'CPAM',
          price_eur: 25, patient_name: 'Marie D.', departure_lat: 43.3, departure_lng: 5.4 },
      ],
      error: null,
    })

    const result = await patronAgendaService.getDaySchedules('org-1', '2026-05-08')

    expect(mockRpc).toHaveBeenCalledWith('get_org_unassigned_missions', expect.objectContaining({ p_org_id: 'org-1' }))
    expect(result.drivers).toHaveLength(2)
    expect(result.drivers[0]).toEqual(expect.objectContaining({ driverId: 'd1', name: 'Alice Martin' }))
    expect(result.drivers[0].blocks).toHaveLength(1)
    expect(result.drivers[0].blocks[0]).toEqual(expect.objectContaining({
      id: 'm1', type: 'CPAM', status: 'in-progress',
      label: 'Hopital Timone → Domicile',
    }))

    expect(result.drivers[1].name).toBe('Bob Smith')
    expect(result.drivers[1].blocks[0].status).toBe('completed')

    expect(result.unassigned).toHaveLength(1)
    expect(result.unassigned[0]).toEqual(expect.objectContaining({
      id: 'u1', type: 'CPAM', price_eur: 25, patient_name: 'Marie D.',
      departure_lat: 43.3, departure_lng: 5.4,
    }))
  })

  it('fallback "Chauffeur" si first_name/last_name null', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({
        data: [{ id: 'd1', profiles: { first_name: null, last_name: null } }],
        error: null,
      })
      return chain({ data: [], error: null })
    })
    const result = await patronAgendaService.getDaySchedules('org-1')
    expect(result.drivers[0].name).toBe('Chauffeur')
  })

  it('tronque endH a 24 si la mission deborde minuit', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({
        data: [{ id: 'd1', profiles: { first_name: 'A', last_name: 'B' } }],
        error: null,
      })
      if (call === 2) return chain({
        data: [{
          id: 'm-late', driver_id: 'd1', scheduled_at: '2026-05-08T23:30:00Z', duration_min: 120,
          status: 'AVAILABLE', departure: 'X', destination: 'Y', type: 'PRIVE', completed_at: null,
        }],
        error: null,
      })
      return chain({ data: [], error: null })
    })
    const result = await patronAgendaService.getDaySchedules('org-1', '2026-05-08')
    expect(result.drivers[0].blocks[0].endH).toBeLessThanOrEqual(24)
  })

  it('jette si la requete unassigned (RPC) echoue', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({ data: [{ id: 'd1', profiles: { first_name: 'A', last_name: 'B' } }], error: null })
      return chain({ data: [], error: null })
    })
    mockRpc.mockResolvedValue({ data: null, error: { message: 'unassigned fail' } })
    await expect(patronAgendaService.getDaySchedules('org-1', '2026-05-08')).rejects.toThrow('unassigned fail')
  })
})
