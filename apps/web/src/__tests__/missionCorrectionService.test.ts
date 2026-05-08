import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionCorrectionService } from '@/services/missionCorrectionService'

const { mockApiPatch } = vi.hoisted(() => ({ mockApiPatch: vi.fn() }))

vi.mock('@/lib/api', () => ({
  api: { patch: mockApiPatch, get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('missionCorrectionService.correct', () => {
  it('PATCH /api/missions/:id/correction avec le patch et retourne la mission', async () => {
    const mission = { id: 'm-1', departure: 'X corrige', price_eur: 27.5 }
    mockApiPatch.mockResolvedValue({ mission })
    const result = await missionCorrectionService.correct('m-1', { departure: 'X corrige', price_eur: 27.5 })
    expect(mockApiPatch).toHaveBeenCalledWith('/api/missions/m-1/correction', { departure: 'X corrige', price_eur: 27.5 })
    expect(result).toEqual(mission)
  })

  it('propage l erreur api.patch (RLS / 403 / network)', async () => {
    mockApiPatch.mockRejectedValue(new Error('Non autorise'))
    await expect(missionCorrectionService.correct('m-1', { phone: '0612345678' })).rejects.toThrow('Non autorise')
  })

  it('accepte un patch partiel (un seul champ)', async () => {
    mockApiPatch.mockResolvedValue({ mission: { id: 'm-1', distance_km: 12.3 } })
    await missionCorrectionService.correct('m-1', { distance_km: 12.3 })
    expect(mockApiPatch).toHaveBeenCalledWith('/api/missions/m-1/correction', { distance_km: 12.3 })
  })
})
