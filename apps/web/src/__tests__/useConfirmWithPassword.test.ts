import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfirmWithPassword } from '@/components/dashboard/driver/useConfirmWithPassword'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockSignIn = vi.fn()

// Référence stable — évite boucle infinie si useEffect([user]) présent
const mockUser = { id: 'u1', email: 'marc@test.com' }

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: (...a: unknown[]) => mockSignIn(...a) },
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSignIn.mockResolvedValue({ error: null })
})

// ─── verify — succès ──────────────────────────────────────────────────────────
describe('useConfirmWithPassword — verify (succes)', () => {
  it('appelle onConfirmed et onClose si mot de passe correct', async () => {
    const onConfirmed = vi.fn().mockResolvedValue(undefined)
    const onClose     = vi.fn()
    const { result } = renderHook(() => useConfirmWithPassword(onConfirmed, onClose))

    act(() => { result.current.setPassword('secret123') })
    await act(async () => { await result.current.verify() })

    expect(mockSignIn).toHaveBeenCalledWith({ email: 'marc@test.com', password: 'secret123' })
    expect(onConfirmed).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })
})

// ─── verify — échec ───────────────────────────────────────────────────────────
describe('useConfirmWithPassword — verify (echec)', () => {
  it('affiche erreur si mot de passe incorrect', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('Invalid login') })
    const onConfirmed = vi.fn().mockResolvedValue(undefined)
    const onClose     = vi.fn()
    const { result } = renderHook(() => useConfirmWithPassword(onConfirmed, onClose))

    act(() => { result.current.setPassword('mauvais') })
    await act(async () => { await result.current.verify() })

    expect(result.current.error).toBe('Mot de passe incorrect')
    expect(onConfirmed).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────
describe('useConfirmWithPassword — reset', () => {
  it('remet password et error a leur valeur initiale', () => {
    const onConfirmed = vi.fn().mockResolvedValue(undefined)
    const onClose     = vi.fn()
    const { result } = renderHook(() => useConfirmWithPassword(onConfirmed, onClose))

    act(() => { result.current.setPassword('abc') })
    act(() => { result.current.reset() })

    expect(result.current.password).toBe('')
    expect(result.current.error).toBeNull()
  })
})
