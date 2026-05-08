import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userRgpdService } from '@/services/userRgpdService'

const { mockApiPost } = vi.hoisted(() => ({ mockApiPost: vi.fn() }))

vi.mock('@/lib/api', () => ({
  api: { post: mockApiPost, get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Reset le mock global de fetch (pas via vi.stubGlobal pour pouvoir cibler par test).
})

describe('userRgpdService.exportData (RGPD art. 20 portabilite)', () => {
  it('retourne un Blob si la response est ok', async () => {
    const fakeBlob = new Blob(['{"missions":[]}'], { type: 'application/json' })
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(fakeBlob),
    })
    vi.stubGlobal('fetch', fetchSpy)
    const result = await userRgpdService.exportData()
    expect(fetchSpy).toHaveBeenCalledWith('/api/users/export', { credentials: 'same-origin' })
    expect(result).toBe(fakeBlob)
  })

  it('jette le message d erreur si la response a un body JSON avec error', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ error: 'Non authentifie' }),
    })
    vi.stubGlobal('fetch', fetchSpy)
    await expect(userRgpdService.exportData()).rejects.toThrow('Non authentifie')
  })

  it('jette "Erreur 500" si la response n a pas de body JSON parsable', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('parse')),
    })
    vi.stubGlobal('fetch', fetchSpy)
    await expect(userRgpdService.exportData()).rejects.toThrow('Erreur 500')
  })
})

describe('userRgpdService.deleteAccount (RGPD art. 17 effacement)', () => {
  it('appelle api.post sur /api/users/delete avec body vide', async () => {
    mockApiPost.mockResolvedValue({ ok: true, anonymized: true, deleted: true })
    const result = await userRgpdService.deleteAccount()
    expect(mockApiPost).toHaveBeenCalledWith('/api/users/delete', {})
    expect(result).toEqual({ ok: true, anonymized: true, deleted: true })
  })

  it('propage l erreur api.post', async () => {
    mockApiPost.mockRejectedValue(new Error('NETWORK'))
    await expect(userRgpdService.deleteAccount()).rejects.toThrow('NETWORK')
  })
})
