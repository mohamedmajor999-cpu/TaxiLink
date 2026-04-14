import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userPrefsService } from '@/services/userPrefsService'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockGetUser    = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser:    mockGetUser,
      updateUser: mockUpdateUser,
    },
  }),
}))

beforeEach(() => { vi.clearAllMocks() })

// ─── getNotificationPrefs ─────────────────────────────────────────────────────
describe('userPrefsService.getNotificationPrefs', () => {
  it('retourne les prefs stockees dans user_metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { notification_prefs: { new_missions: true, sounds: false } } } },
      error: null,
    })
    const result = await userPrefsService.getNotificationPrefs()
    expect(result).toEqual({ new_missions: true, sounds: false })
  })

  it('retourne null si Supabase retourne une erreur', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Non connecte' } })
    const result = await userPrefsService.getNotificationPrefs()
    expect(result).toBeNull()
  })

  it('retourne null si notification_prefs est absent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { user_metadata: {} } }, error: null })
    const result = await userPrefsService.getNotificationPrefs()
    expect(result).toBeNull()
  })
})

// ─── updateNotificationPrefs ──────────────────────────────────────────────────
describe('userPrefsService.updateNotificationPrefs', () => {
  it('appelle updateUser avec les prefs dans data', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    const prefs = { new_missions: true, reminders: false }
    await userPrefsService.updateNotificationPrefs(prefs)
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { notification_prefs: prefs } })
  })

  it('leve une erreur si Supabase retourne une erreur', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Erreur reseau' } })
    await expect(userPrefsService.updateNotificationPrefs({ new_missions: true })).rejects.toThrow('Erreur reseau')
  })
})
