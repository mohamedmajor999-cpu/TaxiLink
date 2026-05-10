import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { patronMarketplaceService } from '@/services/patronMarketplaceService'

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
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
  it('appelle le RPC get_marketplace_missions et retourne tableau vide si aucune mission', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    const result = await patronMarketplaceService.getMarketplace('d-1')
    expect(result).toEqual([])
    expect(mockRpc).toHaveBeenCalledWith('get_marketplace_missions', {
      p_departments: undefined,
      p_limit: 100,
    })
  })

  it('enrichit shared_by_name (initiales) et group_names depuis le RPC masque', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'm-pub', type: 'PRIVE', scheduled_at: '2026-05-09T11:00:00Z',
          departure: 'Hopital, Marseille', destination: 'Domicile, Marseille',
          price_eur: 25, patient_name: 'M. D.',  // deja masque par le RPC
          visibility: 'PUBLIC', shared_by: 'driver-A',
          mission_groups: [],
        },
        {
          id: 'm-grp', type: 'CPAM', scheduled_at: '2026-05-09T12:00:00Z',
          departure: 'X', destination: 'Y',
          price_eur: 30, patient_name: null,
          visibility: 'GROUP', shared_by: 'driver-B',
          mission_groups: [{ group_id: 'g-1' }, { group_id: 'g-2' }],
        },
      ],
      error: null,
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return chain({
        data: [
          { id: 'driver-A', first_name: 'Alice', last_name: 'Martin' },
          { id: 'driver-B', first_name: 'Bob', last_name: 'Smith' },
        ],
      })
      if (table === 'groups') return chain({
        data: [
          { id: 'g-1', name: 'Equipe Marseille' },
          { id: 'g-2', name: 'CPAM 13' },
        ],
      })
      throw new Error(`Unexpected ${table}`)
    })

    const result = await patronMarketplaceService.getMarketplace('d-1')

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('m-pub')  // tri ASC scheduled_at
    expect(result[1].id).toBe('m-grp')
    expect(result[0]).toEqual(expect.objectContaining({
      shared_by_name: 'A. Martin',
      group_names: [],
      visibility: 'PUBLIC',
      patient_name: 'M. D.',  // preserve le masking RPC
    }))
    expect(result[1]).toEqual(expect.objectContaining({
      shared_by_name: 'B. Smith',
      group_names: ['Equipe Marseille', 'CPAM 13'],
      visibility: 'GROUP',
    }))
  })

  it('shared_by_name = "Client" si shared_by est null (mission cliente)', async () => {
    mockRpc.mockResolvedValue({
      data: [{
        id: 'm-client', type: 'CPAM', scheduled_at: '2026-05-09T11:00:00Z',
        departure: 'A', destination: 'B', price_eur: 20, patient_name: null,
        visibility: 'PUBLIC', shared_by: null, mission_groups: [],
      }],
      error: null,
    })
    const result = await patronMarketplaceService.getMarketplace('d-1')
    expect(result).toHaveLength(1)
    expect(result[0].shared_by_name).toBe('Client')
  })

  it('formatte scheduled_label en "Dans Xmin" / "Dans Xh"', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'soon', type: 'PRIVE', scheduled_at: '2026-05-09T10:30:00Z',
          departure: 'A', destination: 'B', price_eur: 10, patient_name: null,
          visibility: 'PUBLIC', shared_by: null, mission_groups: [] },
        { id: 'later', type: 'PRIVE', scheduled_at: '2026-05-09T18:00:00Z',
          departure: 'A', destination: 'B', price_eur: 10, patient_name: null,
          visibility: 'PUBLIC', shared_by: null, mission_groups: [] },
      ],
      error: null,
    })
    const result = await patronMarketplaceService.getMarketplace('d-1')
    expect(result[0].scheduled_label).toMatch(/^Dans 30 min$/)
    expect(result[1].scheduled_label).toMatch(/^Dans 8h$/)
  })
})
