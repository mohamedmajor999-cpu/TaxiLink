import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionService } from '@/services/missionService'

// ─── Mock Supabase ────────────────────────────────────────────────────────────
const mockOrder = vi.fn()
const mockNeq = vi.fn(() => ({ order: mockOrder }))
const mockEqStatus = vi.fn(() => ({ neq: mockNeq, order: mockOrder }))
const mockEqDriver = vi.fn(() => ({ eq: mockEqStatus, neq: mockNeq, order: mockOrder }))
const mockSelect = vi.fn(() => ({ eq: mockEqDriver }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  // Rétablir la chaîne de mocks
  mockOrder.mockReset()
  mockNeq.mockReset()
  mockEqStatus.mockReset()
  mockEqDriver.mockReset()
  mockSelect.mockReset()

  mockNeq.mockReturnValue({ order: mockOrder })
  mockEqStatus.mockReturnValue({ neq: mockNeq, order: mockOrder })
  mockEqDriver.mockReturnValue({ eq: mockEqStatus, neq: mockNeq, order: mockOrder })
  mockSelect.mockReturnValue({ eq: mockEqDriver })
})

// ─── getAgenda ────────────────────────────────────────────────────────────────
describe('missionService.getAgenda', () => {
  it('retourne les missions non terminées du chauffeur', async () => {
    const missions = [
      { id: 'm1', status: 'AVAILABLE', driver_id: 'drv-1' },
      { id: 'm2', status: 'IN_PROGRESS', driver_id: 'drv-1' },
    ]
    mockOrder.mockResolvedValue({ data: missions, error: null })

    const result = await missionService.getAgenda('drv-1')
    expect(result).toEqual(missions)
    expect(mockFrom).toHaveBeenCalledWith('missions')
  })

  it('retourne un tableau vide si data est null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null })
    const result = await missionService.getAgenda('drv-1')
    expect(result).toEqual([])
  })

  it('lève une erreur si Supabase échoue', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    await expect(missionService.getAgenda('drv-1')).rejects.toThrow('DB error')
  })
})

// ─── getDoneByDriver ──────────────────────────────────────────────────────────
describe('missionService.getDoneByDriver', () => {
  it('retourne les missions DONE du chauffeur', async () => {
    const missions = [{ id: 'm3', status: 'DONE', driver_id: 'drv-1' }]
    mockOrder.mockResolvedValue({ data: missions, error: null })

    const result = await missionService.getDoneByDriver('drv-1')
    expect(result).toEqual(missions)
  })

  it('retourne un tableau vide si data est null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null })
    const result = await missionService.getDoneByDriver('drv-1')
    expect(result).toEqual([])
  })

  it('lève une erreur si Supabase échoue', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'Connexion perdue' } })
    await expect(missionService.getDoneByDriver('drv-1')).rejects.toThrow('Connexion perdue')
  })
})
