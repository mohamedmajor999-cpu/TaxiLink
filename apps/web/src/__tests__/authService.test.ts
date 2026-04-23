import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '@/services/authService'

// ─── Mocks Supabase auth ──────────────────────────────────────────────────────
const mockSignIn            = vi.fn()
const mockSignUp            = vi.fn()
const mockResetPassword     = vi.fn()
const mockUpdateUser        = vi.fn()
const mockSignOut           = vi.fn()
const mockSignInWithOAuth   = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword:    mockSignIn,
      signUp:                mockSignUp,
      resetPasswordForEmail: mockResetPassword,
      updateUser:            mockUpdateUser,
      signOut:               mockSignOut,
      signInWithOAuth:       mockSignInWithOAuth,
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

// ─── finalizeSignUp ───────────────────────────────────────────────────────────
describe('authService.finalizeSignUp', () => {
  const params = { email: 'new@test.com', password: 'pass123', first_name: 'Marc', last_name: 'Dupont', department: '13' }

  it('cree le compte avec toutes les metadata', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { identities: [{ id: '1' }] } }, error: null })
    await authService.finalizeSignUp(params)
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@test.com',
      password: 'pass123',
      options: expect.objectContaining({
        data: expect.objectContaining({
          first_name: 'Marc', last_name: 'Dupont', role: 'driver',
          department: '13', dept_preferences: ['13'],
        }),
      }),
    }))
  })

  it('leve une erreur Supabase si signUp echoue', async () => {
    mockSignUp.mockResolvedValue({ data: null, error: { message: 'Rate limit' } })
    await expect(authService.finalizeSignUp(params)).rejects.toThrow('Rate limit')
  })

  it('leve une erreur si email deja inscrit (identities vides)', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { identities: [] } }, error: null })
    await expect(authService.finalizeSignUp(params)).rejects.toThrow('déjà inscrite')
  })
})

// ─── signInWithGoogle ─────────────────────────────────────────────────────────
describe('authService.signInWithGoogle', () => {
  it('appelle signInWithOAuth avec provider google', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null })
    await authService.signInWithGoogle('https://app.com/auth/callback')
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'google',
      options: expect.objectContaining({ redirectTo: 'https://app.com/auth/callback' }),
    }))
  })

  it('leve une erreur si OAuth echoue', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: { message: 'OAuth error' } })
    await expect(authService.signInWithGoogle('https://app.com/auth/callback')).rejects.toThrow('OAuth error')
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

