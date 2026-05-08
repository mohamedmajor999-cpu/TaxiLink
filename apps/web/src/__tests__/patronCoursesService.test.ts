import { describe, it, expect, vi, beforeEach } from 'vitest'
import { patronCoursesService } from '@/services/patronCoursesService'

const { mockFrom, mockRpc } = vi.hoisted(() => ({ mockFrom: vi.fn(), mockRpc: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}))

beforeEach(() => {
  vi.clearAllMocks()
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

describe('patronCoursesService.assignToDriver', () => {
  it('appelle la RPC patron_assign_mission avec mission+driver', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null })
    await patronCoursesService.assignToDriver('m-1', 'drv-1')
    expect(mockRpc).toHaveBeenCalledWith('patron_assign_mission', {
      target_mission_id: 'm-1',
      target_driver_id: 'drv-1',
    })
  })

  it('jette ASSIGN_FAILED si la RPC retourne success=false sans error', async () => {
    mockRpc.mockResolvedValue({ data: { success: false }, error: null })
    await expect(patronCoursesService.assignToDriver('m-1', 'drv-1')).rejects.toThrow('ASSIGN_FAILED')
  })

  it('jette le message d erreur explicite si la RPC en fournit un', async () => {
    mockRpc.mockResolvedValue({ data: { success: false, error: 'NOT_DISPATCHER' }, error: null })
    await expect(patronCoursesService.assignToDriver('m-1', 'drv-1')).rejects.toThrow('NOT_DISPATCHER')
  })

  it('jette si Supabase remonte une erreur de transport', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'connection lost' } })
    await expect(patronCoursesService.assignToDriver('m-1', 'drv-1')).rejects.toThrow('connection lost')
  })
})

describe('patronCoursesService.getOrgDrivers', () => {
  it('retourne les chauffeurs de l org avec name compose first+last', async () => {
    mockFrom.mockReturnValue(chain({
      data: [
        { id: 'd1', is_online: true,  profiles: { first_name: 'Alice', last_name: 'Martin' } },
        { id: 'd2', is_online: false, profiles: { first_name: 'Bob',   last_name: 'Smith' } },
      ],
      error: null,
    }))
    const result = await patronCoursesService.getOrgDrivers('org-1')
    expect(result).toEqual([
      { id: 'd1', name: 'Alice Martin', is_online: true },
      { id: 'd2', name: 'Bob Smith',    is_online: false },
    ])
  })

  it('fallback "Chauffeur" si first_name et last_name sont null', async () => {
    mockFrom.mockReturnValue(chain({
      data: [{ id: 'd1', is_online: false, profiles: { first_name: null, last_name: null } }],
      error: null,
    }))
    const result = await patronCoursesService.getOrgDrivers('org-1')
    expect(result[0].name).toBe('Chauffeur')
  })

  it('retourne tableau vide si data null', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }))
    const result = await patronCoursesService.getOrgDrivers('org-1')
    expect(result).toEqual([])
  })

  it('jette en cas d erreur Supabase', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'denied' } }))
    await expect(patronCoursesService.getOrgDrivers('org-1')).rejects.toThrow('denied')
  })
})
