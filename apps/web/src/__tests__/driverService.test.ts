import { describe, it, expect, vi, beforeEach } from 'vitest'
import { driverService } from '@/services/driverService'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
const { mockFrom, mockSelect, mockUpdate, mockEq, mockEq2, mockMaybeSingle } = vi.hoisted(() => ({
  mockFrom:        vi.fn(),
  mockSelect:      vi.fn(),
  mockUpdate:      vi.fn(),
  mockEq:          vi.fn(),
  mockEq2:         vi.fn(),
  mockMaybeSingle: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })
  mockEq2.mockResolvedValue({ data: null, error: null })
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, eq: mockEq2 })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
})

// ─── getDriver ────────────────────────────────────────────────────────────────
describe('driverService.getDriver', () => {
  it('retourne le chauffeur si trouvé', async () => {
    const fakeDriver = { id: 'd1', vehicle_model: 'Toyota', vehicle_plate: 'AA-001-BB', cpam_enabled: true, rating: 4.8, total_rides: 120, is_online: false }
    mockMaybeSingle.mockResolvedValue({ data: fakeDriver, error: null })
    const result = await driverService.getDriver('d1')
    expect(result).toEqual(fakeDriver)
    expect(mockFrom).toHaveBeenCalledWith('drivers')
  })

  it('retourne null si introuvable', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await driverService.getDriver('inconnu')
    expect(result).toBeNull()
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    await expect(driverService.getDriver('d1')).rejects.toThrow('DB error')
  })
})

// ─── updateDriver ─────────────────────────────────────────────────────────────
describe('driverService.updateDriver', () => {
  it('met a jour sans erreur', async () => {
    mockEq.mockResolvedValue({ error: null })
    await expect(driverService.updateDriver('d1', { vehicle_model: 'BMW', vehicle_plate: 'BB-002-CC', cpam_enabled: false })).resolves.toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledWith({ vehicle_model: 'BMW', vehicle_plate: 'BB-002-CC', cpam_enabled: false })
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Non autorise' } })
    await expect(driverService.updateDriver('d1', { vehicle_model: 'BMW', vehicle_plate: 'BB', cpam_enabled: false })).rejects.toThrow('Non autorise')
  })
})

// ─── setOnline ────────────────────────────────────────────────────────────────
describe('driverService.setOnline', () => {
  it('passe le chauffeur en ligne sans erreur', async () => {
    mockEq.mockResolvedValue({ error: null })
    await expect(driverService.setOnline('d1', true)).resolves.toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledWith({ is_online: true })
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Reseau indisponible' } })
    await expect(driverService.setOnline('d1', false)).rejects.toThrow('Reseau indisponible')
  })
})
