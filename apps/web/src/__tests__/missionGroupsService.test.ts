import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockSelect, mockDelete, mockInsert, mockEqSelect, mockEqDelete } = vi.hoisted(() => ({
  mockFrom:     vi.fn(),
  mockSelect:   vi.fn(),
  mockDelete:   vi.fn(),
  mockInsert:   vi.fn(),
  mockEqSelect: vi.fn(),
  mockEqDelete: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

import { missionGroupsService, replaceMissionGroups } from '@/services/missionGroupsService'

beforeEach(() => {
  vi.clearAllMocks()
  mockEqSelect.mockResolvedValue({ data: [], error: null })
  mockEqDelete.mockResolvedValue({ data: null, error: null })
  mockSelect.mockReturnValue({ eq: mockEqSelect })
  mockDelete.mockReturnValue({ eq: mockEqDelete })
  mockInsert.mockResolvedValue({ data: null, error: null })
  mockFrom.mockReturnValue({ select: mockSelect, delete: mockDelete, insert: mockInsert })
})

// ─── getGroupIds ──────────────────────────────────────────────────────────────
describe('missionGroupsService.getGroupIds', () => {
  it('retourne la liste des group_id pour une mission', async () => {
    mockEqSelect.mockResolvedValue({
      data: [{ group_id: 'g1' }, { group_id: 'g2' }],
      error: null,
    })

    const result = await missionGroupsService.getGroupIds('mission-1')

    expect(mockFrom).toHaveBeenCalledWith('mission_groups')
    expect(mockSelect).toHaveBeenCalledWith('group_id')
    expect(mockEqSelect).toHaveBeenCalledWith('mission_id', 'mission-1')
    expect(result).toEqual(['g1', 'g2'])
  })

  it('retourne [] si data est null', async () => {
    mockEqSelect.mockResolvedValue({ data: null, error: null })

    expect(await missionGroupsService.getGroupIds('mission-2')).toEqual([])
  })

  it('lève une erreur si Supabase retourne une erreur', async () => {
    mockEqSelect.mockResolvedValue({ data: null, error: { message: 'DB down' } })

    await expect(missionGroupsService.getGroupIds('mission-3')).rejects.toThrow('DB down')
  })
})

// ─── replaceMissionGroups ─────────────────────────────────────────────────────
describe('replaceMissionGroups', () => {
  function buildClient() {
    const del = vi.fn().mockResolvedValue({ error: null })
    const insert = vi.fn().mockResolvedValue({ error: null })
    const eq = vi.fn(() => del())
    const from = vi.fn(() => ({
      delete: () => ({ eq }),
      insert,
    }))
    return { client: { from } as unknown as Parameters<typeof replaceMissionGroups>[0], from, eq, del, insert }
  }

  it('supprime les liens existants puis insère les nouveaux groupIds', async () => {
    const { client, from, eq, insert } = buildClient()

    await replaceMissionGroups(client, 'mission-a', ['g1', 'g2'])

    expect(from).toHaveBeenCalledWith('mission_groups')
    expect(eq).toHaveBeenCalledWith('mission_id', 'mission-a')
    expect(insert).toHaveBeenCalledWith([
      { mission_id: 'mission-a', group_id: 'g1' },
      { mission_id: 'mission-a', group_id: 'g2' },
    ])
  })

  it('supprime uniquement si groupIds est vide (pas d insert)', async () => {
    const { client, eq, insert } = buildClient()

    await replaceMissionGroups(client, 'mission-b', [])

    expect(eq).toHaveBeenCalledWith('mission_id', 'mission-b')
    expect(insert).not.toHaveBeenCalled()
  })

  it('lève si le delete échoue', async () => {
    const del = vi.fn().mockResolvedValue({ error: { message: 'delete failed' } })
    const eq = vi.fn(() => del())
    const from = vi.fn(() => ({
      delete: () => ({ eq }),
      insert: vi.fn(),
    }))
    const client = { from } as unknown as Parameters<typeof replaceMissionGroups>[0]

    await expect(replaceMissionGroups(client, 'mission-c', ['g1'])).rejects.toThrow('delete failed')
  })

  it('lève si l insert échoue', async () => {
    const del = vi.fn().mockResolvedValue({ error: null })
    const eq = vi.fn(() => del())
    const insert = vi.fn().mockResolvedValue({ error: { message: 'insert failed' } })
    const from = vi.fn(() => ({
      delete: () => ({ eq }),
      insert,
    }))
    const client = { from } as unknown as Parameters<typeof replaceMissionGroups>[0]

    await expect(replaceMissionGroups(client, 'mission-d', ['g1'])).rejects.toThrow('insert failed')
  })
})
