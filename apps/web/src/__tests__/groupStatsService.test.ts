import { describe, it, expect, vi, beforeEach } from 'vitest'
import { groupStatsService } from '@/services/groupStatsService'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
// getMembers : .from().select().eq()  → mockEq resout les membres
// getMemberStats : membres via .from().select().eq() + activite via .rpc()
const { mockFrom, mockSelect, mockEq, mockRpc } = vi.hoisted(() => ({
  mockFrom:   vi.fn(),
  mockSelect: vi.fn(),
  mockEq:     vi.fn(),
  mockRpc:    vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockEq.mockResolvedValue({ data: [], error: null })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
  mockRpc.mockResolvedValue({ data: [], error: null })
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

    // Requete membres (.from().select().eq()) → resout les membres
    mockEq.mockResolvedValue({
      data: [
        { driver_id: 'drv-1', role: 'admin', drivers: { profiles: { full_name: 'A', first_name: 'Alice', last_name: 'Martin', department: '75', phone: '0612345678' }, is_online: true } },
        { driver_id: 'drv-2', role: 'member', drivers: { profiles: { full_name: 'B', first_name: 'Bob', last_name: 'Smith', department: '13', phone: null }, is_online: false } },
      ],
      error: null,
    })
    // Activite via RPC masque get_group_activity_rows → lignes plates (sans PII)
    mockRpc.mockResolvedValue({
      data: [
        { shared_by: 'drv-1', driver_id: null,    created_at: since, accepted_at: null },
        { shared_by: 'drv-1', driver_id: 'drv-2', created_at: since, accepted_at: since },
      ],
      error: null,
    })

    const result = await groupStatsService.getMemberStats('g1', since)
    expect(mockRpc).toHaveBeenCalledWith('get_group_activity_rows', { p_group_id: 'g1', p_since: since })
    expect(result[0].driverId).toBe('drv-1')
    expect(result[0].sharedCount).toBe(2)
    expect(result[0].phone).toBe('0612345678')
    expect(result[1].acceptedCount).toBe(1)
    expect(result[1].phone).toBeNull()
  })

  it('leve une erreur si la requete membres echoue', async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: 'Erreur membres' } })
    mockRpc.mockResolvedValue({ data: [], error: null })
    await expect(groupStatsService.getMemberStats('g1', '2026-01-01')).rejects.toThrow('Erreur membres')
  })
})
