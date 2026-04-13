import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLoginForm } from '@/components/auth/useLoginForm'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPush    = vi.fn()
const mockSignIn  = vi.fn()
const mockGetRole = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/lib/validators', () => ({
  isValidEmail: (v: string) => v.includes('@') && v.includes('.'),
}))

vi.mock('@/services/authService', () => ({
  authService: { signIn: (...a: unknown[]) => mockSignIn(...a) },
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
    mockSignIn.mockResolvedValue({ user: { id: 'u1' }, session: {} })
    mockGetRole.mockResolvedValue('driver')
    const { result } = renderHook(() => useLoginForm())
    act(() => { result.current.setEmail('test@test.com'); result.current.setPassword('pass123') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/chauffeur')
    expect(result.current.error).toBe('')
  })

  it('redirige vers /dashboard/client si role client', async () => {
    mockSignIn.mockResolvedValue({ user: { id: 'u2' }, session: {} })
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
