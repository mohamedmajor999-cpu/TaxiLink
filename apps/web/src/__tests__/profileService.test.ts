import { describe, it, expect, vi, beforeEach } from 'vitest'
import { profileService } from '@/services/profileService'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
const { mockFrom, mockSelect, mockUpdate, mockUpsert, mockEq, mockSingle } = vi.hoisted(() => ({
  mockFrom:   vi.fn(),
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockUpsert: vi.fn(),
  mockEq:     vi.fn(),
  mockSingle: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

// Helper : builder update avec resultat select() renvoyant { data, error } final
function mockUpdateChain(result: { data: unknown; error: unknown }) {
  const terminal = vi.fn().mockResolvedValue(result)
  const eqStep = vi.fn().mockReturnValue({ select: terminal })
  mockUpdate.mockReturnValue({ eq: eqStep })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockEq.mockReturnValue({ single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockUpsert.mockResolvedValue({ error: null })
  mockUpdateChain({ data: [{ id: 'u1' }], error: null })
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate, upsert: mockUpsert })
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
  it('met a jour sans erreur quand la ligne existe', async () => {
    mockUpdateChain({ data: [{ id: 'u1' }], error: null })
    await expect(profileService.updateProfile('u1', { full_name: 'Nouveau Nom', phone: '0607080910' })).resolves.toBeUndefined()
    expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'Nouveau Nom', phone: '0607080910' })
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('leve une erreur si Supabase echoue sur update', async () => {
    mockUpdateChain({ data: null, error: { message: 'Erreur mise a jour' } })
    await expect(profileService.updateProfile('u1', { full_name: 'X' })).rejects.toThrow('Erreur mise a jour')
  })

  it('fait un upsert fallback si la ligne n\'existe pas', async () => {
    mockUpdateChain({ data: [], error: null })
    await expect(profileService.updateProfile('u1', { first_name: 'Yannis', last_name: 'Major', phone: '0601020304' })).resolves.toBeUndefined()
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1', first_name: 'Yannis', last_name: 'Major', phone: '0601020304' }),
      { onConflict: 'id' },
    )
  })

  it('leve une erreur si l\'upsert fallback echoue', async () => {
    mockUpdateChain({ data: [], error: null })
    mockUpsert.mockResolvedValue({ error: { message: 'RLS denied' } })
    await expect(profileService.updateProfile('u1', { first_name: 'X', last_name: 'Y' })).rejects.toThrow('RLS denied')
  })
})
