import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionMutations } from '@/services/missionMutations'

const { mockFrom, mockBroadcast, mockApiPost, mockApiPatch, mockApiDelete } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockBroadcast: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiPatch: vi.fn(),
  mockApiDelete: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))
vi.mock('@/lib/missionBroadcast', () => ({
  broadcastMissionAccepted: mockBroadcast,
}))
vi.mock('@/lib/api', () => ({
  api: { post: mockApiPost, patch: mockApiPatch, delete: mockApiDelete, get: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// Proxy chain qui se replie sur le finalResult quand awaite. Permet de mocker
// n'importe quelle longueur de chaine Supabase fluent (.eq.eq.select.single ...).
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

describe('missionMutations.accept', () => {
  it('flip AVAILABLE→IN_PROGRESS et broadcast l acceptation', async () => {
    mockFrom.mockReturnValue(chain({ data: [{ id: 'm1' }], error: null }))
    mockBroadcast.mockResolvedValue(undefined)
    await missionMutations.accept('m1', 'drv-1')
    expect(mockFrom).toHaveBeenCalledWith('missions')
    expect(mockBroadcast).toHaveBeenCalledWith(expect.anything(), 'm1')
  })

  it('jette si la mission est deja prise (data vide)', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }))
    await expect(missionMutations.accept('m1', 'drv-1')).rejects.toThrow('déjà acceptée')
    expect(mockBroadcast).not.toHaveBeenCalled()
  })

  it('jette si Supabase remonte une erreur RLS', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'RLS denied' } }))
    await expect(missionMutations.accept('m1', 'drv-1')).rejects.toThrow('RLS denied')
  })
})

describe('missionMutations.complete', () => {
  it('passe la mission a DONE avec completed_at', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }))
    await missionMutations.complete('m1')
    expect(mockFrom).toHaveBeenCalledWith('missions')
  })

  it('jette en cas d erreur Supabase', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'fail' } }))
    await expect(missionMutations.complete('m1')).rejects.toThrow('fail')
  })
})

describe('missionMutations.cancel', () => {
  it('lit les notes existantes, pose un marker d annulation et remet la mission AVAILABLE', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({ data: { notes: 'notes existantes' }, error: null })
      return chain({ data: null, error: null })
    })
    await missionMutations.cancel('m1', 'patient absent')
    expect(call).toBe(2)
  })

  it('marche aussi si notes est null (cree un nouveau marker seul)', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({ data: { notes: null }, error: null })
      return chain({ data: null, error: null })
    })
    await missionMutations.cancel('m1', 'pas de raison')
    expect(call).toBe(2)
  })
})

describe('missionMutations.create / update / remove', () => {
  it('create POST sur /api/missions et retourne la mission', async () => {
    const mission = { id: 'new', departure: 'A', destination: 'B' }
    mockApiPost.mockResolvedValue({ mission })
    // @ts-expect-error — mock signature simplified for test
    const result = await missionMutations.create({ departure: 'A', destination: 'B' })
    expect(mockApiPost).toHaveBeenCalledWith('/api/missions', { departure: 'A', destination: 'B' })
    expect(result).toEqual(mission)
  })

  it('update PATCH sur /api/missions/:id et retourne la mission', async () => {
    const mission = { id: 'm1', departure: 'X' }
    mockApiPatch.mockResolvedValue({ mission })
    // @ts-expect-error — mock signature simplified for test
    const result = await missionMutations.update('m1', { departure: 'X' })
    expect(mockApiPatch).toHaveBeenCalledWith('/api/missions/m1', { departure: 'X' })
    expect(result).toEqual(mission)
  })

  it('remove DELETE sur /api/missions/:id', async () => {
    mockApiDelete.mockResolvedValue({ ok: true })
    await missionMutations.remove('m1')
    expect(mockApiDelete).toHaveBeenCalledWith('/api/missions/m1')
  })
})

describe('missionMutations.boostPrice', () => {
  it('lit le prix actuel, ajoute le delta, et persiste la nouvelle valeur', async () => {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) return chain({ data: { price_eur: 20 }, error: null })
      return chain({ data: { id: 'm1', price_eur: 25 }, error: null })
    })
    const result = await missionMutations.boostPrice('m1', 5)
    expect(call).toBe(2)
    expect(result).toEqual({ id: 'm1', price_eur: 25 })
  })

  it('jette si la lecture du prix actuel echoue', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'not found' } }))
    await expect(missionMutations.boostPrice('m1', 5)).rejects.toThrow('not found')
  })
})
