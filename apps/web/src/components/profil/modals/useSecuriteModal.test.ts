import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSecuriteModal } from './useSecuriteModal'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const { mockSignIn, mockUpdatePassword, mockUser } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockUpdatePassword: vi.fn(),
  mockUser: { email: 'chauffeur@test.fr' },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/services/authService', () => ({
  authService: {
    signIn: mockSignIn,
    updatePassword: mockUpdatePassword,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useSecuriteModal', () => {
  it('démarre avec des champs vides et sans erreur', () => {
    const { result } = renderHook(() => useSecuriteModal())
    expect(result.current.currentPassword).toBe('')
    expect(result.current.newPassword).toBe('')
    expect(result.current.error).toBeNull()
    expect(result.current.success).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('met à jour currentPassword', () => {
    const { result } = renderHook(() => useSecuriteModal())
    act(() => { result.current.setCurrentPassword('ancienMDP') })
    expect(result.current.currentPassword).toBe('ancienMDP')
  })

  it('met à jour newPassword', () => {
    const { result } = renderHook(() => useSecuriteModal())
    act(() => { result.current.setNewPassword('nouveauMDP') })
    expect(result.current.newPassword).toBe('nouveauMDP')
  })

  it('retourne une erreur si le nouveau mot de passe est trop court', async () => {
    const { result } = renderHook(() => useSecuriteModal())
    act(() => { result.current.setNewPassword('abc') })
    await act(async () => { await result.current.changePassword() })
    expect(result.current.error).toMatch(/6 caractères/)
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('appelle signIn puis updatePassword si tout est valide', async () => {
    mockSignIn.mockResolvedValue(undefined)
    mockUpdatePassword.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSecuriteModal())
    act(() => {
      result.current.setCurrentPassword('ancienMDP123')
      result.current.setNewPassword('nouveauMDP123')
    })
    await act(async () => { await result.current.changePassword() })

    expect(mockSignIn).toHaveBeenCalledWith('chauffeur@test.fr', 'ancienMDP123')
    expect(mockUpdatePassword).toHaveBeenCalledWith('nouveauMDP123')
    expect(result.current.success).toBe(true)
    expect(result.current.currentPassword).toBe('')
    expect(result.current.newPassword).toBe('')
  })

  it('affiche une erreur si signIn échoue (mauvais mot de passe actuel)', async () => {
    mockSignIn.mockRejectedValue(new Error('Identifiants invalides'))

    const { result } = renderHook(() => useSecuriteModal())
    act(() => {
      result.current.setCurrentPassword('mauvais')
      result.current.setNewPassword('nouveauMDP123')
    })
    await act(async () => { await result.current.changePassword() })

    expect(result.current.error).toBe('Identifiants invalides')
    expect(result.current.success).toBe(false)
    expect(mockUpdatePassword).not.toHaveBeenCalled()
  })
})
