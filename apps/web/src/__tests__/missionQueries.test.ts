import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionQueries } from '@/services/missionQueries'

const { mockFrom, mockRpc } = vi.hoisted(() => ({ mockFrom: vi.fn(), mockRpc: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// Helpers : usine de chaines Supabase qui se replient sur la derniere etape
// (la promise resolue). Permet de mocker n'importe quelle longueur de chain.
function chain(finalResult: { data: unknown; error: unknown }) {
  const terminal: Record<string, ReturnType<typeof vi.fn>> = {}
  const handler: ProxyHandler<typeof terminal> = {
    get(target, prop: string) {
      if (prop === 'then') {
        // L'objet est await-able : retourne le resultat final
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

describe('missionQueries.getAvailable', () => {
  it('appelle le RPC get_marketplace_missions avec les departements filtres', async () => {
    mockRpc.mockResolvedValue({ data: [{ id: 'm1' }, { id: 'm2' }], error: null })
    const result = await missionQueries.getAvailable(['75', '93'], 50)
    expect(mockRpc).toHaveBeenCalledWith('get_marketplace_missions', {
      p_departments: ['75', '93'],
      p_limit: 50,
    })
    expect(result).toEqual([{ id: 'm1' }, { id: 'm2' }])
  })

  it('passe undefined si la liste de departements est vide (legacy : voit tout)', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    await missionQueries.getAvailable([])
    expect(mockRpc).toHaveBeenCalledWith('get_marketplace_missions', expect.objectContaining({ p_departments: undefined }))
  })

  it('jette si le RPC retourne une erreur', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })
    await expect(missionQueries.getAvailable(['75'])).rejects.toThrow('RLS denied')
  })
})

describe('missionQueries.getCurrentForDriver', () => {
  it('retourne la mission IN_PROGRESS la plus recente du driver', async () => {
    const c = chain({ data: [{ id: 'cur', status: 'IN_PROGRESS' }], error: null })
    mockFrom.mockReturnValue(c)
    const result = await missionQueries.getCurrentForDriver('drv-1')
    expect(mockFrom).toHaveBeenCalledWith('missions')
    expect(result).toEqual({ id: 'cur', status: 'IN_PROGRESS' })
  })

  it('retourne null si aucune mission en cours', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }))
    const result = await missionQueries.getCurrentForDriver('drv-1')
    expect(result).toBeNull()
  })
})

describe('missionQueries.getById', () => {
  it('retourne la mission si trouvee', async () => {
    mockFrom.mockReturnValue(chain({ data: { id: 'm-x' }, error: null }))
    const result = await missionQueries.getById('m-x')
    expect(result).toEqual({ id: 'm-x' })
  })

  it('retourne null si erreur (mission inexistante ou RLS deny)', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'not found' } }))
    const result = await missionQueries.getById('m-ghost')
    expect(result).toBeNull()
  })
})

describe('missionQueries.getDoneByDriver / getClientMissions / getSharedByUser / getAgenda', () => {
  it('getDoneByDriver retourne tableau vide si data null', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }))
    const result = await missionQueries.getDoneByDriver('drv-1')
    expect(result).toEqual([])
  })

  it('getClientMissions remonte l erreur Supabase', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'fail' } }))
    await expect(missionQueries.getClientMissions('cli-1')).rejects.toThrow('fail')
  })

  it('getSharedByUser remonte l erreur Supabase', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'oops' } }))
    await expect(missionQueries.getSharedByUser('user-1', '2026-01-01T00:00:00Z')).rejects.toThrow('oops')
  })

  it('getAgenda retourne les missions du driver triees par scheduled_at', async () => {
    const data = [{ id: 'm1' }, { id: 'm2' }]
    mockFrom.mockReturnValue(chain({ data, error: null }))
    const result = await missionQueries.getAgenda('drv-1')
    expect(mockFrom).toHaveBeenCalledWith('missions')
    expect(result).toEqual(data)
  })
})
