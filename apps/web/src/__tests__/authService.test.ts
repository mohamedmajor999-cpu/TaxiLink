import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '@/services/authService'

// ─── Mocks Supabase auth ──────────────────────────────────────────────────────
const mockSignIn         = vi.fn()
const mockSignUp         = vi.fn()
const mockResetPassword  = vi.fn()
const mockUpdateUser     = vi.fn()
const mockSignOut        = vi.fn()
const mockGetUser        = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword:    mockSignIn,
      signUp:                mockSignUp,
      resetPasswordForEmail: mockResetPassword,
      updateUser:            mockUpdateUser,
      signOut:               mockSignOut,
      getUser:               mockGetUser,
    },
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── signIn ───────────────────────────────────────────────────────────────────
describe('authService.signIn', () => {
  it('connecte un utilisateur et retourne les données de session', async () => {
    const fakeData = { session: { access_token: 'tok' }, user: { id: 'u1' } }
    mockSignIn.mockResolvedValue({ data: fakeData, error: null })
    const result = await authService.signIn('test@test.com', 'pass123')
    expect(result).toEqual(fakeData)
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'test@test.com', password: 'pass123' })
  })

  it('leve une erreur si les identifiants sont invalides', async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } })
    await expect(authService.signIn('bad@test.com', 'wrong')).rejects.toThrow('Invalid login credentials')
  })
})

// ─── signUp ───────────────────────────────────────────────────────────────────
describe('authService.signUp', () => {
  const params = { email: 'new@test.com', password: 'pass123', full_name: 'Jean Dupont', role: 'driver' }

  it('inscrit un utilisateur sans erreur', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    await expect(authService.signUp(params)).resolves.toBeUndefined()
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({ email: params.email }))
  })

  it('leve une erreur si l email est deja utilise', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'User already registered' } })
    await expect(authService.signUp(params)).rejects.toThrow('User already registered')
  })
})

// ─── resetPassword ────────────────────────────────────────────────────────────
describe('authService.resetPassword', () => {
  it('envoie un email de reinitialisation sans erreur', async () => {
    mockResetPassword.mockResolvedValue({ error: null })
    await expect(authService.resetPassword('test@test.com', 'http://localhost/reset')).resolves.toBeUndefined()
    expect(mockResetPassword).toHaveBeenCalledWith('test@test.com', { redirectTo: 'http://localhost/reset' })
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockResetPassword.mockResolvedValue({ error: { message: 'Rate limit exceeded' } })
    await expect(authService.resetPassword('test@test.com', 'http://localhost/reset')).rejects.toThrow('Rate limit exceeded')
  })
})

// ─── updateEmail ──────────────────────────────────────────────────────────────
describe('authService.updateEmail', () => {
  it('met a jour l email sans erreur', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    await expect(authService.updateEmail('new@test.com')).resolves.toBeUndefined()
    expect(mockUpdateUser).toHaveBeenCalledWith({ email: 'new@test.com' })
  })

  it('leve une erreur si Supabase echoue', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Email deja utilise' } })
    await expect(authService.updateEmail('taken@test.com')).rejects.toThrow('Email deja utilise')
  })
})

// ─── signOut ──────────────────────────────────────────────────────────────────
describe('authService.signOut', () => {
  it('deconnecte sans erreur', async () => {
    mockSignOut.mockResolvedValue({})
    await expect(authService.signOut()).resolves.toBeUndefined()
    expect(mockSignOut).toHaveBeenCalledOnce()
  })
})

// ─── updatePassword ───────────────────────────────────────────────────────────
describe('authService.updatePassword', () => {
  it('appelle updateUser avec le nouveau mot de passe', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    await authService.updatePassword('nouveauMDP123')
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'nouveauMDP123' })
  })

  it('leve une erreur si Supabase retourne une erreur', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Mot de passe trop court' } })
    await expect(authService.updatePassword('abc')).rejects.toThrow('Mot de passe trop court')
  })
})

// ─── getNotificationPrefs ─────────────────────────────────────────────────────
describe('authService.getNotificationPrefs', () => {
  it('retourne les prefs stockees dans user_metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { notification_prefs: { new_missions: true, sounds: false } } } },
      error: null,
    })
    const result = await authService.getNotificationPrefs()
    expect(result).toEqual({ new_missions: true, sounds: false })
  })

  it('retourne null si Supabase retourne une erreur', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Non connecte' } })
    const result = await authService.getNotificationPrefs()
    expect(result).toBeNull()
  })

  it('retourne null si notification_prefs est absent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { user_metadata: {} } }, error: null })
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

  it('leve une erreur si Supabase retourne une erreur', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Erreur reseau' } })
    await expect(authService.updateNotificationPrefs({ new_missions: true })).rejects.toThrow('Erreur reseau')
  })
})
