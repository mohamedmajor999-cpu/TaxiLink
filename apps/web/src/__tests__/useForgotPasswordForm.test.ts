import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useForgotPasswordForm } from '@/components/auth/useForgotPasswordForm'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockResetPassword = vi.fn()

vi.mock('@/services/authService', () => ({
  authService: { resetPassword: (...a: unknown[]) => mockResetPassword(...a) },
}))

const preventDefault = vi.fn()
const fakeEvent = { preventDefault } as unknown as React.FormEvent

beforeEach(() => { vi.clearAllMocks() })

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useForgotPasswordForm — état initial', () => {
  it('démarre avec email vide, pas de chargement, pas envoyé, pas d\'erreur', () => {
    const { result } = renderHook(() => useForgotPasswordForm())
    expect(result.current.email).toBe('')
    expect(result.current.loading).toBe(false)
    expect(result.current.sent).toBe(false)
    expect(result.current.error).toBe('')
  })
})

// ─── Envoi réussi ─────────────────────────────────────────────────────────────
describe('useForgotPasswordForm — envoi réussi', () => {
  it('passe sent à true après succès', async () => {
    mockResetPassword.mockResolvedValue(undefined)
    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => { result.current.setEmail('test@taxi.fr') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.sent).toBe(true)
    expect(result.current.error).toBe('')
    expect(result.current.loading).toBe(false)
  })

  it('appelle resetPassword avec l\'email saisi', async () => {
    mockResetPassword.mockResolvedValue(undefined)
    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => { result.current.setEmail('chauffeur@taxi.fr') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(mockResetPassword).toHaveBeenCalledWith('chauffeur@taxi.fr', expect.stringContaining('/auth/reset-password'))
  })
})

// ─── Erreur ───────────────────────────────────────────────────────────────────
describe('useForgotPasswordForm — erreur', () => {
  it('affiche le message d\'erreur si le service échoue', async () => {
    mockResetPassword.mockRejectedValue(new Error('Email introuvable'))
    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => { result.current.setEmail('inconnu@taxi.fr') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toBe('Email introuvable')
    expect(result.current.sent).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('affiche "Erreur inconnue" si l\'erreur n\'est pas une instance d\'Error', async () => {
    mockResetPassword.mockRejectedValue('fail')
    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => { result.current.setEmail('test@taxi.fr') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toBe('Erreur inconnue')
  })
})

// ─── setEmail ─────────────────────────────────────────────────────────────────
describe('useForgotPasswordForm — setEmail', () => {
  it('met à jour l\'email', () => {
    const { result } = renderHook(() => useForgotPasswordForm())
    act(() => { result.current.setEmail('nouveau@taxi.fr') })
    expect(result.current.email).toBe('nouveau@taxi.fr')
  })
})
