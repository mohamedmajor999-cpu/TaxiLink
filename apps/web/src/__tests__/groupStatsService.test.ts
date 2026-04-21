import { describe, it, expect, vi, beforeEach } from 'vitest'
import { groupStatsService } from '@/services/groupStatsService'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
const { mockFrom, mockSelect, mockEq, mockGte } = vi.hoisted(() => ({
  mockFrom:   vi.fn(),
  mockSelect: vi.fn(),
  mockEq:     vi.fn(),
  mockGte:    vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGte.mockResolvedValue({ data: [], error: null })
  mockEq.mockReturnValue({ gte: mockGte })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
})

// ─── getMembers ───────────────────────────────────────────────────────────────
describe('groupStatsService.getMembers', () => {
  it('retourne les membres avec leur nom complet', async () => {
    mockEq.mockResolvedValue({
      data: [
        { id: 'mem-1', group_id: 'g1', driver_id: 'drv-1', role: 'admin', joined_at: '2026-01-01',
          drivers: { profiles: { full_name: 'Jean Dupont' } } },
      ],
      error: null,
    })
    const result = await groupStatsService.getMembers('g1')
    expect(result).toHaveLength(1)
    expect(result[0].fullName).toBe('Jean Dupont')
    expect(result[0].role).toBe('admin')
  })

  it('retourne null pour fullName si drivers est absent', async () => {
    mockEq.mockResolvedValue({
      data: [{ id: 'mem-2', group_id: 'g1', driver_id: 'drv-2', role: 'member', joined_at: '2026-01-01', drivers: null }],
      error: null,
    })
    const result = await groupStatsService.getMembers('g1')
    expect(result[0].fullName).toBeNull()
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: 'Acces refuse' } })
    await expect(groupStatsService.getMembers('g1')).rejects.toThrow('Acces refuse')
  })
})

// ─── getMemberStats ───────────────────────────────────────────────────────────
describe('groupStatsService.getMemberStats', () => {
  it('retourne les stats triees par activite decroissante', async () => {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

    mockEq.mockImplementation((col: string) => {
      if (col === 'group_id') {
        return {
          // For missions query, adds .gte()
          gte: mockGte,
          // For members query, resolves directly
          then: (resolve: any) => Promise.resolve({
            data: [
              { driver_id: 'drv-1', role: 'admin', drivers: { profiles: { full_name: 'A', first_name: 'Alice', last_name: 'Martin', department: '75' }, is_online: true } },
              { driver_id: 'drv-2', role: 'member', drivers: { profiles: { full_name: 'B', first_name: 'Bob', last_name: 'Smith', department: '13' }, is_online: false } },
            ],
            error: null,
          }).then(resolve),
        }
      }
      return { gte: mockGte }
    })
    mockGte.mockResolvedValue({ data: [{ missions: { shared_by: 'drv-1', driver_id: null } }, { missions: { shared_by: 'drv-1', driver_id: 'drv-2' } }], error: null })

    const result = await groupStatsService.getMemberStats('g1', since)
    expect(result[0].driverId).toBe('drv-1')
    expect(result[0].sharedCount).toBe(2)
    expect(result[1].acceptedCount).toBe(1)
  })

  it('leve une erreur si la requete membres echoue', async () => {
    mockEq.mockReturnValue({
      gte: mockGte,
      then: (resolve: any) => Promise.resolve({ data: null, error: { message: 'Erreur membres' } }).then(resolve),
    })
    mockGte.mockResolvedValue({ data: [], error: null })
    await expect(groupStatsService.getMemberStats('g1', '2026-01-01')).rejects.toThrow('Erreur membres')
  })
})
