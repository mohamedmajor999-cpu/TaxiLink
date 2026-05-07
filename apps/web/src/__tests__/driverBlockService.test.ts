import { describe, it, expect, vi, beforeEach } from 'vitest'
import { driverBlockService } from '@/services/driverBlockService'

// ─── Mock Supabase ────────────────────────────────────────────────────────────
const { mockFrom, mockSelect, mockInsert, mockDelete, mockEq, mockEqDelete2, mockEqOrder, mockOrder, mockIn } = vi.hoisted(() => ({
  mockFrom:        vi.fn(),
  mockSelect:      vi.fn(),
  mockInsert:      vi.fn(),
  mockDelete:      vi.fn(),
  mockEq:          vi.fn(),
  mockEqDelete2:   vi.fn(),
  mockEqOrder:     vi.fn(),
  mockOrder:       vi.fn(),
  mockIn:          vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Setup defaults : chains compatibles avec toutes les méthodes du service
  mockEq.mockResolvedValue({ data: [], error: null })
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockEqOrder.mockReturnValue({ order: mockOrder })
  mockIn.mockResolvedValue({ data: [], error: null })
  mockEqDelete2.mockResolvedValue({ data: null, error: null })
  mockSelect.mockReturnValue({ eq: vi.fn(() => ({ order: mockOrder, ...mockEq })), in: mockIn })
  mockInsert.mockResolvedValue({ data: null, error: null })
  mockDelete.mockReturnValue({ eq: vi.fn(() => ({ eq: mockEqDelete2 })) })
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, delete: mockDelete })
})

describe('driverBlockService.getBlockedIds', () => {
  it('retourne la liste des blocked_id du blocker', async () => {
    const mockEqInner = vi.fn().mockResolvedValue({
      data: [{ blocked_id: 'drv-2' }, { blocked_id: 'drv-3' }],
      error: null,
    })
    mockSelect.mockReturnValue({ eq: mockEqInner })
    const ids = await driverBlockService.getBlockedIds('drv-1')
    expect(ids).toEqual(['drv-2', 'drv-3'])
  })

  it('retourne un tableau vide si aucun blocage', async () => {
    const mockEqInner = vi.fn().mockResolvedValue({ data: null, error: null })
    mockSelect.mockReturnValue({ eq: mockEqInner })
    const ids = await driverBlockService.getBlockedIds('drv-1')
    expect(ids).toEqual([])
  })

  it('lève une erreur si Supabase échoue', async () => {
    const mockEqInner = vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } })
    mockSelect.mockReturnValue({ eq: mockEqInner })
    await expect(driverBlockService.getBlockedIds('drv-1')).rejects.toThrow('RLS denied')
  })
})

describe('driverBlockService.block', () => {
  it("refuse d'auto-bloquer", async () => {
    await expect(driverBlockService.block('drv-1', 'drv-1')).rejects.toThrow(/soi-même/)
  })

  it('insère blocker_id + blocked_id dans driver_blocks', async () => {
    await driverBlockService.block('drv-1', 'drv-2')
    expect(mockFrom).toHaveBeenCalledWith('driver_blocks')
    expect(mockInsert).toHaveBeenCalledWith({ blocker_id: 'drv-1', blocked_id: 'drv-2' })
  })

  it('ignore silencieusement le doublon (unique violation)', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'duplicate key value violates unique constraint "driver_blocks_unique_pair"' } })
    await expect(driverBlockService.block('drv-1', 'drv-2')).resolves.toBeUndefined()
  })

  it('relève les autres erreurs Supabase', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    await expect(driverBlockService.block('drv-1', 'drv-2')).rejects.toThrow('permission denied')
  })
})

describe('driverBlockService.unblock', () => {
  it('delete par paire (blocker_id + blocked_id)', async () => {
    await driverBlockService.unblock('drv-1', 'drv-2')
    expect(mockFrom).toHaveBeenCalledWith('driver_blocks')
    expect(mockDelete).toHaveBeenCalled()
  })

  it('lève une erreur si Supabase échoue', async () => {
    mockEqDelete2.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })
    await expect(driverBlockService.unblock('drv-1', 'drv-2')).rejects.toThrow('RLS denied')
  })
})
