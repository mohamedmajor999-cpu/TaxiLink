import { describe, it, expect, vi, beforeEach } from 'vitest'
import { profileService } from '@/services/profileService'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
const { mockFrom, mockSelect, mockUpdate, mockEq, mockSingle } = vi.hoisted(() => ({
  mockFrom:   vi.fn(),
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockEq:     vi.fn(),
  mockSingle: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockEq.mockReturnValue({ single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
})

// ─── getProfile ───────────────────────────────────────────────────────────────
describe('profileService.getProfile', () => {
  it('retourne le profil complet', async () => {
    const fakeProfile = { id: 'u1', full_name: 'Marc Dupont', phone: '0601020304', role: 'driver' }
    mockSingle.mockResolvedValue({ data: fakeProfile, error: null })
    const result = await profileService.getProfile('u1')
    expect(result).toEqual(fakeProfile)
    expect(mockFrom).toHaveBeenCalledWith('profiles')
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Non trouve' } })
    await expect(profileService.getProfile('u1')).rejects.toThrow('Non trouve')
  })
})

// ─── getRole ──────────────────────────────────────────────────────────────────
describe('profileService.getRole', () => {
  it('retourne le role du profil', async () => {
    mockSingle.mockResolvedValue({ data: { role: 'driver' }, error: null })
    const result = await profileService.getRole('u1')
    expect(result).toBe('driver')
  })

  it('retourne null si data est vide', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null })
    const result = await profileService.getRole('u1')
    expect(result).toBeNull()
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Acces refuse' } })
    await expect(profileService.getRole('u1')).rejects.toThrow('Acces refuse')
  })
})

// ─── updateProfile ────────────────────────────────────────────────────────────
describe('profileService.updateProfile', () => {
  it('met a jour sans erreur', async () => {
    const mockEqUpdate = vi.fn().mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEqUpdate })
    await expect(profileService.updateProfile('u1', { full_name: 'Nouveau Nom', phone: '0607080910' })).resolves.toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'Nouveau Nom', phone: '0607080910' })
  })

  it('leve une erreur si Supabase echoue', async () => {
    const mockEqUpdate = vi.fn().mockResolvedValue({ error: { message: 'Erreur mise a jour' } })
    mockUpdate.mockReturnValue({ eq: mockEqUpdate })
    await expect(profileService.updateProfile('u1', { full_name: 'X' })).rejects.toThrow('Erreur mise a jour')
  })
})
