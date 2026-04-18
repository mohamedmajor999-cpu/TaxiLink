import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionService } from '@/services/missionService'
import { api } from '@/lib/api'

// ─── Mocks chaîne SELECT ──────────────────────────────────────────────────────
const mockLimit       = vi.fn()
const mockOrder       = vi.fn()
const mockMaybeSingle = vi.fn()
const mockNeq         = vi.fn()
const mockGt          = vi.fn()
const mockEqStatus    = vi.fn()
const mockEqDriver    = vi.fn()
const mockSelect      = vi.fn()

// ─── Mocks chaîne UPDATE ──────────────────────────────────────────────────────
const mockUpdateSelect = vi.fn()
const mockUpdateEq2    = vi.fn()
const mockUpdateEq1    = vi.fn()
const mockUpdate       = vi.fn()

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

vi.mock('@/lib/api', () => ({ api: { post: vi.fn() } }))

const mission = {
  id: 'm1', status: 'AVAILABLE', driver_id: null, client_id: 'c1',
  departure: 'Paris', destination: 'Lyon',
  scheduled_at: '2026-05-01T10:00:00Z',
  price_eur: 120, distance_km: 450, duration_min: 240, type: 'VSL',
}

beforeEach(() => {
  vi.clearAllMocks()

  // SELECT : from → select → eq(driver) → { eq(status), neq, order }
  //                                eq(status) → { neq, order, maybeSingle, limit }
  //                                order → { limit } (pour getCurrentForDriver)
  //                                order est aussi awaitable (pour getAvailable/getAgenda/…)
  mockLimit.mockResolvedValue({ data: [mission], error: null })
  mockOrder.mockReturnValue({
    limit: mockLimit,
    then: (onFulfilled: (v: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve({ data: [mission], error: null }).then(onFulfilled),
  })
  mockMaybeSingle.mockResolvedValue({ data: mission, error: null })
  mockNeq.mockReturnValue({ order: mockOrder })
  mockGt.mockReturnValue({ order: mockOrder })
  mockEqStatus.mockReturnValue({ neq: mockNeq, gt: mockGt, order: mockOrder, maybeSingle: mockMaybeSingle })
  mockEqDriver.mockReturnValue({ eq: mockEqStatus, neq: mockNeq, gt: mockGt, order: mockOrder })
  mockSelect.mockReturnValue({ eq: mockEqDriver })

  // UPDATE : from → update → eq1 → résout directement (complete)
  //                          eq1 → eq2 → select (accept, override par describe)
  mockUpdateSelect.mockResolvedValue({ data: [mission], error: null })
  mockUpdateEq2.mockReturnValue({ select: mockUpdateSelect })
  mockUpdateEq1.mockResolvedValue({ error: null })
  mockUpdate.mockReturnValue({ eq: mockUpdateEq1 })

  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
})

// ─── getAvailable ─────────────────────────────────────────────────────────────
describe('missionService.getAvailable', () => {
  it('retourne les missions disponibles', async () => {
    const result = await missionService.getAvailable()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('m1')
    expect(mockFrom).toHaveBeenCalledWith('missions')
  })

  it('retourne [] si data est null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null })
    const result = await missionService.getAvailable()
    expect(result).toEqual([])
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    await expect(missionService.getAvailable()).rejects.toThrow('DB error')
  })
})

// ─── getCurrentForDriver ──────────────────────────────────────────────────────
describe('missionService.getCurrentForDriver', () => {
  it('retourne la mission en cours la plus recente', async () => {
    mockLimit.mockResolvedValue({ data: [{ ...mission, status: 'IN_PROGRESS' }], error: null })
    const result = await missionService.getCurrentForDriver('drv-1')
    expect(result?.id).toBe('m1')
  })

  it('retourne null si aucune mission en cours', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null })
    const result = await missionService.getCurrentForDriver('drv-1')
    expect(result).toBeNull()
  })

  it('retourne null si data est null', async () => {
    mockLimit.mockResolvedValue({ data: null, error: null })
    const result = await missionService.getCurrentForDriver('drv-1')
    expect(result).toBeNull()
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'Acces refuse' } })
    await expect(missionService.getCurrentForDriver('drv-1')).rejects.toThrow('Acces refuse')
  })
})

// ─── accept ───────────────────────────────────────────────────────────────────
describe('missionService.accept', () => {
  beforeEach(() => {
    // accept enchaîne : update → eq1 → eq2 → select (pas terminal sur eq1)
    mockUpdateEq1.mockReturnValue({ eq: mockUpdateEq2 })
  })

  it('accepte une mission sans erreur', async () => {
    mockUpdateSelect.mockResolvedValue({ data: [mission], error: null })
    await expect(missionService.accept('m1', 'drv-1')).resolves.toBeUndefined()
  })

  it('leve une erreur si la mission est deja prise', async () => {
    mockUpdateSelect.mockResolvedValue({ data: [], error: null })
    await expect(missionService.accept('m1', 'drv-1')).rejects.toThrow('déjà acceptée')
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockUpdateSelect.mockResolvedValue({ data: null, error: { message: 'RLS violation' } })
    await expect(missionService.accept('m1', 'drv-1')).rejects.toThrow('RLS violation')
  })
})

// ─── complete ─────────────────────────────────────────────────────────────────
describe('missionService.complete', () => {
  it('complete une mission sans erreur', async () => {
    mockUpdateEq1.mockResolvedValue({ error: null })
    await expect(missionService.complete('m1')).resolves.toBeUndefined()
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockUpdateEq1.mockResolvedValue({ error: { message: 'Non autorise' } })
    await expect(missionService.complete('m1')).rejects.toThrow('Non autorise')
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

  it('leve une erreur si Supabase echoue', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'Connexion perdue' } })
    await expect(missionService.getDoneByDriver('drv-1')).rejects.toThrow('Connexion perdue')
  })
})

// ─── getClientMissions ────────────────────────────────────────────────────────
describe('missionService.getClientMissions', () => {
  it('retourne les missions du client', async () => {
    mockOrder.mockResolvedValue({ data: [mission], error: null })
    const result = await missionService.getClientMissions('c1')
    expect(result).toHaveLength(1)
    expect(result[0].client_id).toBe('c1')
  })

  it('retourne [] si data est null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null })
    const result = await missionService.getClientMissions('c1')
    expect(result).toEqual([])
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'Acces refuse' } })
    await expect(missionService.getClientMissions('c1')).rejects.toThrow('Acces refuse')
  })
})

// ─── create ───────────────────────────────────────────────────────────────────
describe('missionService.create', () => {
  it('cree une mission via l API et la retourne', async () => {
    vi.mocked(api.post).mockResolvedValue({ mission })
    const input = { departure: 'Paris', destination: 'Lyon', scheduled_at: '2026-05-01T10:00:00Z', type: 'CPAM' as const }
    const result = await missionService.create(input as Parameters<typeof missionService.create>[0])
    expect(result.id).toBe('m1')
    expect(api.post).toHaveBeenCalledWith('/api/missions', input)
  })

  it('leve une erreur si l API echoue', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Validation echouee'))
    const input = { departure: 'A', destination: 'B', scheduled_at: '2026-05-01T10:00:00Z', type: 'CPAM' as const }
    await expect(
      missionService.create(input as Parameters<typeof missionService.create>[0])
    ).rejects.toThrow('Validation echouee')
  })
})

// ─── getAgenda ────────────────────────────────────────────────────────────────
describe('missionService.getAgenda', () => {
  it('retourne les missions non terminees du chauffeur', async () => {
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

  it('leve une erreur si Supabase echoue', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    await expect(missionService.getAgenda('drv-1')).rejects.toThrow('DB error')
  })
})
