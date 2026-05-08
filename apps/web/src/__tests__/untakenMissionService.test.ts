import { describe, it, expect, vi, beforeEach } from 'vitest'
import { untakenMissionService } from '@/services/untakenMissionService'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

/**
 * Le service fait deux requêtes en chaîne :
 *   1. missions : candidates AVAILABLE/STALE de l'user créées il y a > 2 min
 *   2. mission_offers : offres PENDING non expirées sur ces candidates
 * Une mission est "stuck" si elle apparaît en (1) mais PAS en (2).
 */
function mockSupabaseTwoStep(opts: {
  candidates: Array<{ id: string }>
  pending:    Array<{ mission_id: string }>
}) {
  const candidatesChain = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ data: opts.candidates, error: null }),
        }),
      }),
    }),
  }
  const pendingChain = {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gt: vi.fn().mockResolvedValue({ data: opts.pending, error: null }),
        }),
      }),
    }),
  }
  let call = 0
  mockFrom.mockImplementation((table: string) => {
    call++
    if (table === 'missions') return candidatesChain
    if (table === 'mission_offers') return pendingChain
    throw new Error(`Unexpected table: ${table} (call ${call})`)
  })
}

describe('untakenMissionService.getStuck', () => {
  it('retourne tableau vide si aucune mission AVAILABLE > 2min', async () => {
    mockSupabaseTwoStep({ candidates: [], pending: [] })
    const result = await untakenMissionService.getStuck('user-1')
    expect(result).toEqual([])
  })

  it('exclut les missions ayant encore une offre PENDING en cours', async () => {
    mockSupabaseTwoStep({
      candidates: [{ id: 'm-stuck' }, { id: 'm-still-cascading' }],
      pending:    [{ mission_id: 'm-still-cascading' }],
    })
    const result = await untakenMissionService.getStuck('user-1') as Array<{ id: string }>
    expect(result.map((m) => m.id)).toEqual(['m-stuck'])
  })

  it('retourne toutes les candidates si aucune offre PENDING', async () => {
    mockSupabaseTwoStep({
      candidates: [{ id: 'm1' }, { id: 'm2' }],
      pending:    [],
    })
    const result = await untakenMissionService.getStuck('user-1') as Array<{ id: string }>
    expect(result.map((m) => m.id)).toEqual(['m1', 'm2'])
  })
})
