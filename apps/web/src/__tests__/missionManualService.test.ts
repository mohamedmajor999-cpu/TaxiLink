import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionManualService } from '@/services/missionManualService'

// ─── Mocks chaîne Supabase ────────────────────────────────────────────────────
const mockSingle    = vi.fn()
const mockSelect    = vi.fn()
const mockIsClient  = vi.fn()
const mockIsShared  = vi.fn()
const mockEqStatus  = vi.fn()
const mockEqId      = vi.fn()
const mockUpdate    = vi.fn()
const mockInsert    = vi.fn()
const mockDeleteIsClient  = vi.fn()
const mockDeleteIsShared  = vi.fn()
const mockDeleteEqStatus  = vi.fn()
const mockDeleteEqId      = vi.fn()
const mockDelete    = vi.fn()
const mockFrom      = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

// Le service vit dans @taxilink/services et importe extractDepartement depuis
// @taxilink/core. On mock la source cross-platform, pas le re-export web.
vi.mock('@taxilink/core', async () => {
  const actual = await vi.importActual<typeof import('@taxilink/core')>('@taxilink/core')
  return {
    ...actual,
    extractDepartement: (addr: string) => (addr.includes('Paris') ? '75' : null),
  }
})

const mission = {
  id: 'm1',
  driver_id: 'drv-1',
  status: 'ACCEPTED',
  type: 'PRIVE',
  departure: 'Paris',
  destination: 'Lyon',
  scheduled_at: '2026-05-10T09:00:00Z',
  shared_by: null,
  client_id: null,
}

const input = {
  departure: 'Paris',
  destination: 'Lyon',
  scheduledAt: '2026-05-10T09:00:00Z',
  type: 'PRIVE' as const,
  priceEur: 35,
  patientName: null,
  notes: null,
}

beforeEach(() => {
  vi.clearAllMocks()

  mockSingle.mockResolvedValue({ data: mission, error: null })
  mockSelect.mockReturnValue({ single: mockSingle })

  // UPDATE chain : update().eq(id).eq(status).is(shared_by).is(client_id).select().single()
  mockIsClient.mockReturnValue({ select: mockSelect })
  mockIsShared.mockReturnValue({ is: mockIsClient })
  mockEqStatus.mockReturnValue({ is: mockIsShared })
  mockEqId.mockReturnValue({ eq: mockEqStatus })
  mockUpdate.mockReturnValue({ eq: mockEqId })

  // INSERT chain : insert().select().single()
  mockInsert.mockReturnValue({ select: mockSelect })

  // DELETE chain : delete().eq(id).eq(status).is(shared_by).is(client_id) → terminal
  mockDeleteIsClient.mockResolvedValue({ error: null })
  mockDeleteIsShared.mockReturnValue({ is: mockDeleteIsClient })
  mockDeleteEqStatus.mockReturnValue({ is: mockDeleteIsShared })
  mockDeleteEqId.mockReturnValue({ eq: mockDeleteEqStatus })
  mockDelete.mockReturnValue({ eq: mockDeleteEqId })

  mockFrom.mockReturnValue({ insert: mockInsert, update: mockUpdate, delete: mockDelete })
})

describe('missionManualService.create', () => {
  it('insère une mission manuelle avec status=ACCEPTED + visibility=PRIVATE', async () => {
    const result = await missionManualService.create('drv-1', input)
    expect(result).toEqual(mission)
    expect(mockFrom).toHaveBeenCalledWith('missions')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      driver_id: 'drv-1',
      status: 'ACCEPTED',
      visibility: 'PRIVATE',
      departure: 'Paris',
      destination: 'Lyon',
      departement: '75',
    }))
  })

  it('lève une erreur si Supabase échoue', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'RLS violation' } })
    await expect(missionManualService.create('drv-1', input)).rejects.toThrow('RLS violation')
  })
})

describe('missionManualService.update', () => {
  it('met à jour la mission filtrée par status=ACCEPTED + shared_by=null + client_id=null', async () => {
    const result = await missionManualService.update('m1', input)
    expect(result).toEqual(mission)
    expect(mockEqId).toHaveBeenCalledWith('id', 'm1')
    expect(mockEqStatus).toHaveBeenCalledWith('status', 'ACCEPTED')
    expect(mockIsShared).toHaveBeenCalledWith('shared_by', null)
    expect(mockIsClient).toHaveBeenCalledWith('client_id', null)
  })

  it('lève une erreur si Supabase échoue', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Mission introuvable' } })
    await expect(missionManualService.update('m1', input)).rejects.toThrow('Mission introuvable')
  })
})

describe('missionManualService.remove', () => {
  it('supprime la mission filtrée par status=ACCEPTED + shared_by=null + client_id=null', async () => {
    await expect(missionManualService.remove('m1')).resolves.toBeUndefined()
    expect(mockDeleteEqId).toHaveBeenCalledWith('id', 'm1')
    expect(mockDeleteEqStatus).toHaveBeenCalledWith('status', 'ACCEPTED')
    expect(mockDeleteIsShared).toHaveBeenCalledWith('shared_by', null)
    expect(mockDeleteIsClient).toHaveBeenCalledWith('client_id', null)
  })

  it('lève une erreur si Supabase échoue', async () => {
    mockDeleteIsClient.mockResolvedValue({ error: { message: 'Permission denied' } })
    await expect(missionManualService.remove('m1')).rejects.toThrow('Permission denied')
  })
})
