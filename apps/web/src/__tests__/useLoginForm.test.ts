import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLoginForm } from '@/components/auth/useLoginForm'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPush    = vi.fn()
const mockSignIn  = vi.fn()
const mockGetRole = vi.fn()
const mockSignInWithGoogle = vi.fn()
const mockSignOut = vi.fn()
const mockResendConfirmation = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/lib/validators', () => ({
  isValidEmail: (v: string) => v.includes('@') && v.includes('.'),
}))

vi.mock('@/services/authService', () => ({
  authService: {
    signIn: (...a: unknown[]) => mockSignIn(...a),
    signInWithGoogle: (...a: unknown[]) => mockSignInWithGoogle(...a),
    signOut: (...a: unknown[]) => mockSignOut(...a),
    resendConfirmation: (...a: unknown[]) => mockResendConfirmation(...a),
  },
}))

vi.mock('@/services/profileService', () => ({
  profileService: { getRole: (...a: unknown[]) => mockGetRole(...a) },
}))

const preventDefault = vi.fn()
const fakeEvent = { preventDefault } as unknown as React.FormEvent

beforeEach(() => { vi.clearAllMocks() })

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useLoginForm — état initial', () => {
  it('démarre avec des champs vides et sans erreur', () => {
    const { result } = renderHook(() => useLoginForm())
    expect(result.current.email).toBe('')
    expect(result.current.password).toBe('')
    expect(result.current.error).toBe('')
    expect(result.current.loading).toBe(false)
  })
})

// ─── Validation ───────────────────────────────────────────────────────────────
describe('useLoginForm — validation', () => {
  it('refuse si email invalide', async () => {
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('pasunemail') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toBe('Adresse email invalide')
    expect(mockSignIn).not.toHaveBeenCalled()
  })
})

// ─── Connexion réussie ────────────────────────────────────────────────────────
describe('useLoginForm — connexion', () => {
  it('redirige vers /dashboard/chauffeur si role driver', async () => {
    mockSignIn.mockResolvedValue({ user: { id: 'u1', email_confirmed_at: '2024-01-01T00:00:00Z' }, session: {} })
    mockGetRole.mockResolvedValue('driver')
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('test@test.com'); result.current.setPassword('pass123') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur')
    expect(result.current.error).toBe('')
  })

  it('redirige vers /dashboard/client si role client', async () => {
    mockSignIn.mockResolvedValue({ user: { id: 'u2', email_confirmed_at: '2024-01-01T00:00:00Z' }, session: {} })
    mockGetRole.mockResolvedValue('client')
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('test@test.com'); result.current.setPassword('pass123') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/client')
  })

  it('affiche un message lisible si credentials invalides', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'))
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('test@test.com'); result.current.setPassword('mauvais') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toBe('Email ou mot de passe incorrect')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('affiche le message brut pour les autres erreurs', async () => {
    mockSignIn.mockRejectedValue(new Error('Compte désactivé'))
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('test@test.com'); result.current.setPassword('pass123') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toBe('Compte désactivé')
  })
})

// ─── Email non confirmé ───────────────────────────────────────────────────────
describe('useLoginForm — email non confirmé', () => {
  it('bloque la connexion et déconnecte si email_confirmed_at est null', async () => {
    mockSignIn.mockResolvedValue({ user: { id: 'u3', email_confirmed_at: null }, session: {} })
    mockSignOut.mockResolvedValue(undefined)
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('test@test.com'); result.current.setPassword('pass123') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockSignOut).toHaveBeenCalled()
    expect(result.current.needsConfirmation).toBe(true)
    expect(result.current.error).toMatch(/Confirme ton adresse email/)
  })

  it('mappe l\'erreur Supabase "Email not confirmed" sur le mode confirmation', async () => {
    mockSignIn.mockRejectedValue(new Error('Email not confirmed'))
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('test@test.com'); result.current.setPassword('pass123') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.needsConfirmation).toBe(true)
    expect(result.current.error).toMatch(/Confirme ton adresse email/)
  })
})

// ─── Renvoyer le mail de confirmation ─────────────────────────────────────────
describe('useLoginForm — handleResend', () => {
  it('appelle resendConfirmation avec l\'email saisi et marque resendSent', async () => {
    mockResendConfirmation.mockResolvedValue(undefined)
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('test@test.com') })
    await act(async () => { await result.current.handleResend() })
    expect(mockResendConfirmation).toHaveBeenCalledWith('test@test.com')
    expect(result.current.resendSent).toBe(true)
  })

  it('expose l\'erreur si le renvoi échoue', async () => {
    mockResendConfirmation.mockRejectedValue(new Error('Trop de tentatives'))
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('test@test.com') })
    await act(async () => { await result.current.handleResend() })
    expect(result.current.resendSent).toBe(false)
    expect(result.current.error).toBe('Trop de tentatives')
  })
})

// ─── Connexion Google ─────────────────────────────────────────────────────────
describe('useLoginForm — handleGoogle', () => {
  it('appelle signInWithGoogle avec l\'URL de callback de l\'origine courante', async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined)
    const { result } = renderHook(() => useLoginForm())
    await act(async () => { await result.current.handleGoogle() })
    expect(mockSignInWithGoogle).toHaveBeenCalledWith(`${window.location.origin}/auth/callback`)
    expect(result.current.error).toBe('')
  })

  it('remet googleLoading à false et affiche l\'erreur si OAuth échoue', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('OAuth error'))
    const { result } = renderHook(() => useLoginForm())
    await act(async () => { await result.current.handleGoogle() })
    expect(result.current.error).toBe('OAuth error')
    expect(result.current.googleLoading).toBe(false)
  })
})
