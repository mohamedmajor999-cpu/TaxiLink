import { describe, it, expect, vi, beforeEach } from 'vitest'
import { missionService } from '@/services/missionService'

// ─── Mocks chaîne UPDATE : update → eq(id) → eq(status) ───────────────────────
const mockUpdateEq2 = vi.fn()
const mockUpdateEq1 = vi.fn()
const mockUpdate = vi.fn()

// ─── Mocks chaîne SELECT (markNoShow lit notes existantes) ────────────────────
const mockSelectSingle = vi.fn()
const mockSelectEq = vi.fn()
const mockSelect = vi.fn()

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  // UPDATE termine sur eq(status). Default: succès.
  mockUpdateEq2.mockResolvedValue({ error: null })
  mockUpdateEq1.mockReturnValue({ eq: mockUpdateEq2 })
  mockUpdate.mockReturnValue({ eq: mockUpdateEq1 })

  // SELECT termine sur .single(). Default: notes vides.
  mockSelectSingle.mockResolvedValue({ data: { notes: '' }, error: null })
  mockSelectEq.mockReturnValue({ single: mockSelectSingle })
  mockSelect.mockReturnValue({ eq: mockSelectEq })

  mockFrom.mockReturnValue({ update: mockUpdate, select: mockSelect })
})

describe('missionService.markEnRoute', () => {
  it('renseigne enroute_at avec un timestamp ISO et filtre status=IN_PROGRESS', async () => {
    await missionService.markEnRoute('m1')
    const patch = mockUpdate.mock.calls[0][0]
    expect(patch.enroute_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(mockUpdateEq1).toHaveBeenCalledWith('id', 'm1')
    expect(mockUpdateEq2).toHaveBeenCalledWith('status', 'IN_PROGRESS')
  })

  it('lève une erreur si Supabase échoue', async () => {
    mockUpdateEq2.mockResolvedValueOnce({ error: { message: 'RLS violation' } })
    await expect(missionService.markEnRoute('m1')).rejects.toThrow('RLS violation')
  })
})

describe('missionService.markOnBoard', () => {
  it('renseigne pickup_at et filtre status=IN_PROGRESS', async () => {
    await missionService.markOnBoard('m1')
    const patch = mockUpdate.mock.calls[0][0]
    expect(patch.pickup_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(mockUpdateEq2).toHaveBeenCalledWith('status', 'IN_PROGRESS')
  })

  it('lève une erreur si Supabase échoue', async () => {
    mockUpdateEq2.mockResolvedValueOnce({ error: { message: 'KO' } })
    await expect(missionService.markOnBoard('m1')).rejects.toThrow('KO')
  })
})

describe('missionService.markDropped', () => {
  it('renseigne dropoff_at sans clôturer la course (status reste IN_PROGRESS)', async () => {
    await missionService.markDropped('m1')
    const patch = mockUpdate.mock.calls[0][0]
    expect(patch.dropoff_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(patch.status).toBeUndefined()
    expect(patch.completed_at).toBeUndefined()
  })

  it('lève une erreur si Supabase échoue', async () => {
    mockUpdateEq2.mockResolvedValueOnce({ error: { message: 'KO' } })
    await expect(missionService.markDropped('m1')).rejects.toThrow('KO')
  })
})

describe('missionService.markNoShow', () => {
  it('clôture la course avec no_show=true et trace le motif dans notes', async () => {
    await missionService.markNoShow('m1', 'Patient absent au RDV')
    const patch = mockUpdate.mock.calls[0][0]
    expect(patch.status).toBe('DONE')
    expect(patch.no_show).toBe(true)
    expect(patch.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(patch.notes).toContain('No-show')
    expect(patch.notes).toContain('Patient absent au RDV')
  })

  it('préserve les notes existantes en les concaténant', async () => {
    mockSelectSingle.mockResolvedValueOnce({ data: { notes: 'Ancienne note' }, error: null })
    await missionService.markNoShow('m1', 'Pas là')
    const patch = mockUpdate.mock.calls[0][0]
    expect(patch.notes).toContain('No-show')
    expect(patch.notes).toContain('Pas là')
    expect(patch.notes).toContain('Ancienne note')
  })

  it('lève une erreur si Supabase échoue à l\'update', async () => {
    mockUpdateEq2.mockResolvedValueOnce({ error: { message: 'RLS' } })
    await expect(missionService.markNoShow('m1', 'X')).rejects.toThrow('RLS')
  })
})
