import { describe, it, expect, vi, beforeEach } from 'vitest'
import { groupService } from '@/services/groupService'

// ─── Mock Supabase (vi.hoisted pour éviter le problème d'initialisation) ──────
const { mockFrom, mockSelect, mockInsert, mockDelete, mockEq, mockEq2, mockSingle } = vi.hoisted(() => ({
  mockFrom:   vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockDelete: vi.fn(),
  mockEq:     vi.fn(),
  mockEq2:    vi.fn(),
  mockSingle: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockEq2.mockResolvedValue({ data: null, error: null })
  mockEq.mockReturnValue({ eq: mockEq2 })
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockInsert.mockReturnValue({ select: mockSelect })
  mockDelete.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, delete: mockDelete })
})

// ─── getMyGroups ──────────────────────────────────────────────────────────────
describe('groupService.getMyGroups', () => {
  it('retourne les groupes du chauffeur', async () => {
    mockEq.mockResolvedValue({
      data: [
        { groups: { id: 'g1', name: 'Groupe A', description: null, created_by: 'drv-1', created_at: '2026-01-01', updated_at: '2026-01-01' } },
      ],
      error: null,
    })
    const result = await groupService.getMyGroups('drv-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('g1')
    expect(result[0].name).toBe('Groupe A')
  })

  it('retourne un tableau vide si data est null', async () => {
    mockEq.mockResolvedValue({ data: null, error: null })
    const result = await groupService.getMyGroups('drv-1')
    expect(result).toEqual([])
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    await expect(groupService.getMyGroups('drv-1')).rejects.toThrow('DB error')
  })
})

// ─── getMembers ───────────────────────────────────────────────────────────────
describe('groupService.getMembers', () => {
  it('retourne les membres avec leur nom complet', async () => {
    mockEq.mockResolvedValue({
      data: [
        { id: 'mem-1', group_id: 'g1', driver_id: 'drv-1', role: 'admin', joined_at: '2026-01-01', drivers: { profiles: { full_name: 'Jean Dupont' } } },
      ],
      error: null,
    })
    const result = await groupService.getMembers('g1')
    expect(result).toHaveLength(1)
    expect(result[0].fullName).toBe('Jean Dupont')
    expect(result[0].role).toBe('admin')
  })

  it('retourne null pour fullName si drivers est absent', async () => {
    mockEq.mockResolvedValue({
      data: [{ id: 'mem-2', group_id: 'g1', driver_id: 'drv-2', role: 'member', joined_at: '2026-01-01', drivers: null }],
      error: null,
    })
    const result = await groupService.getMembers('g1')
    expect(result[0].fullName).toBeNull()
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: 'Acces refuse' } })
    await expect(groupService.getMembers('g1')).rejects.toThrow('Acces refuse')
  })
})

// ─── join ─────────────────────────────────────────────────────────────────────
describe('groupService.join', () => {
  it('insere un membre sans erreur', async () => {
    mockInsert.mockResolvedValue({ error: null })
    await expect(groupService.join('g1', 'drv-2')).resolves.toBeUndefined()
  })

  it('leve une erreur si insert echoue', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'Deja membre' } })
    await expect(groupService.join('g1', 'drv-2')).rejects.toThrow('Deja membre')
  })
})

// ─── leave ────────────────────────────────────────────────────────────────────
describe('groupService.leave', () => {
  it('supprime le membre sans erreur', async () => {
    mockEq2.mockResolvedValue({ error: null })
    await expect(groupService.leave('g1', 'drv-1')).resolves.toBeUndefined()
  })

  it('leve une erreur si delete echoue', async () => {
    mockEq2.mockResolvedValue({ error: { message: 'Non autorise' } })
    await expect(groupService.leave('g1', 'drv-1')).rejects.toThrow('Non autorise')
  })
})
