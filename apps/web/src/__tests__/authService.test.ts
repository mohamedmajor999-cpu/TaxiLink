import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '@/services/authService'

// ─── Mock Supabase client ─────────────────────────────────────────────────────
const mockUpdateUser = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
      getUser: mockGetUser,
    },
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── updatePassword ───────────────────────────────────────────────────────────
describe('authService.updatePassword', () => {
  it('appelle updateUser avec le nouveau mot de passe', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    await authService.updatePassword('nouveauMDP123')
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'nouveauMDP123' })
  })

  it('lève une erreur si Supabase retourne une erreur', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Mot de passe trop court' } })
    await expect(authService.updatePassword('abc')).rejects.toThrow('Mot de passe trop court')
  })
})

// ─── getNotificationPrefs ─────────────────────────────────────────────────────
describe('authService.getNotificationPrefs', () => {
  it('retourne les prefs stockées dans user_metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { notification_prefs: { new_missions: true, sounds: false } } } },
      error: null,
    })
    const result = await authService.getNotificationPrefs()
    expect(result).toEqual({ new_missions: true, sounds: false })
  })

  it('retourne null si Supabase retourne une erreur', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Non connecté' } })
    const result = await authService.getNotificationPrefs()
    expect(result).toBeNull()
  })

  it('retourne null si notification_prefs est absent', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: {} } },
      error: null,
    })
    const result = await authService.getNotificationPrefs()
    expect(result).toBeNull()
  })
})

// ─── updateNotificationPrefs ──────────────────────────────────────────────────
describe('authService.updateNotificationPrefs', () => {
  it('appelle updateUser avec les prefs dans data', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    const prefs = { new_missions: true, reminders: false }
    await authService.updateNotificationPrefs(prefs)
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { notification_prefs: prefs } })
  })

  it('lève une erreur si Supabase retourne une erreur', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Erreur réseau' } })
    await expect(authService.updateNotificationPrefs({ new_missions: true })).rejects.toThrow('Erreur réseau')
  })
})
