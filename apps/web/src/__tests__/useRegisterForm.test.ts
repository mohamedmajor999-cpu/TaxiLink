import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRegisterForm } from '@/components/auth/useRegisterForm'

const mockBeginSignUp    = vi.fn()
const mockFinalizeSignUp = vi.fn()
const mockSignInWithGoogle = vi.fn()

vi.mock('@/services/authService', () => ({
  authService: {
    beginSignUp:      (...a: unknown[]) => mockBeginSignUp(...a),
    finalizeSignUp:   (...a: unknown[]) => mockFinalizeSignUp(...a),
    signInWithGoogle: (...a: unknown[]) => mockSignInWithGoogle(...a),
  },
}))

vi.mock('@/lib/validators', () => ({
  isValidEmail:    (v: string) => v.includes('@') && v.includes('.'),
  isValidPassword: (v: string) => v.length >= 8,
  isValidPhone:    (v: string) => /^0[0-9]{9}$/.test(v),
}))

const preventDefault = vi.fn()
const fakeEvent = { preventDefault } as unknown as React.FormEvent

beforeEach(() => { vi.clearAllMocks() })

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useRegisterForm — état initial', () => {
  it('démarre à l étape 1', () => {
    const { result } = renderHook(() => useRegisterForm())
    expect(result.current.step).toBe(1)
    expect(result.current.success).toBe(false)
    expect(result.current.error).toBe('')
    expect(result.current.step1Loading).toBe(false)
  })
})

// ─── Étape 1 : validation locale ─────────────────────────────────────────────
describe('useRegisterForm — étape 1 (validation locale)', () => {
  it('refuse si email invalide', async () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setEmail('pasunemail') })
    await act(async () => { await result.current.handleNextStep(fakeEvent) })
    expect(result.current.error).toBe('Adresse email invalide')
    expect(mockBeginSignUp).not.toHaveBeenCalled()
    expect(result.current.step).toBe(1)
  })

  it('refuse si mot de passe trop court', async () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setEmail('test@test.com'); result.current.setPassword('abc') })
    await act(async () => { await result.current.handleNextStep(fakeEvent) })
    expect(result.current.error).toContain('8 caractères')
    expect(mockBeginSignUp).not.toHaveBeenCalled()
  })

  it('refuse si les mots de passe ne correspondent pas', async () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => {
      result.current.setEmail('test@test.com')
      result.current.setPassword('password123')
      result.current.setConfirmPassword('autrechose')
    })
    await act(async () => { await result.current.handleNextStep(fakeEvent) })
    expect(result.current.error).toContain('correspondent pas')
    expect(mockBeginSignUp).not.toHaveBeenCalled()
  })
})

// ─── Étape 1 : appel Supabase ─────────────────────────────────────────────────
describe('useRegisterForm — étape 1 (appel Supabase)', () => {
  const fillStep1 = (result: { current: ReturnType<typeof useRegisterForm> }) => {
    act(() => {
      result.current.setEmail('test@test.com')
      result.current.setPassword('password123')
      result.current.setConfirmPassword('password123')
    })
  }

  it('passe à l étape 2 si beginSignUp réussit', async () => {
    mockBeginSignUp.mockResolvedValue(undefined)
    const { result } = renderHook(() => useRegisterForm())
    fillStep1(result)
    await act(async () => { await result.current.handleNextStep(fakeEvent) })
    expect(mockBeginSignUp).toHaveBeenCalledWith('test@test.com', 'password123')
    expect(result.current.step).toBe(2)
  })

  it('affiche l erreur email déjà inscrit à l étape 1', async () => {
    mockBeginSignUp.mockRejectedValue(new Error('Cette adresse email est déjà inscrite. Connectez-vous ou réinitialisez votre mot de passe.'))
    const { result } = renderHook(() => useRegisterForm())
    fillStep1(result)
    await act(async () => { await result.current.handleNextStep(fakeEvent) })
    expect(result.current.error).toContain('déjà inscrite')
    expect(result.current.step).toBe(1)
  })
})

// ─── Étape 2 : soumission du profil ──────────────────────────────────────────
describe('useRegisterForm — étape 2', () => {
  const goToStep2 = async (result: { current: ReturnType<typeof useRegisterForm> }) => {
    mockBeginSignUp.mockResolvedValue(undefined)
    act(() => {
      result.current.setEmail('test@test.com')
      result.current.setPassword('password123')
      result.current.setConfirmPassword('password123')
    })
    await act(async () => { await result.current.handleNextStep(fakeEvent) })
  }

  it('refuse si le prénom est manquant', async () => {
    const { result } = renderHook(() => useRegisterForm())
    await goToStep2(result)
    act(() => { result.current.setLastName('Dupont') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toContain('prénom')
    expect(result.current.success).toBe(false)
  })

  it('refuse si le nom est manquant', async () => {
    const { result } = renderHook(() => useRegisterForm())
    await goToStep2(result)
    act(() => { result.current.setFirstName('Marc') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toContain('nom')
  })

  it('appelle finalizeSignUp avec les bons paramètres', async () => {
    mockFinalizeSignUp.mockResolvedValue(undefined)
    const { result } = renderHook(() => useRegisterForm())
    await goToStep2(result)
    act(() => {
      result.current.setFirstName('Marc')
      result.current.setLastName('Dupont')
      result.current.setDepartment('13')
    })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(mockFinalizeSignUp).toHaveBeenCalledWith(expect.objectContaining({
      first_name: 'Marc', last_name: 'Dupont', department: '13',
    }))
    expect(result.current.success).toBe(true)
  })

  it('affiche une erreur si finalizeSignUp échoue', async () => {
    mockFinalizeSignUp.mockRejectedValue(new Error('Erreur serveur'))
    const { result } = renderHook(() => useRegisterForm())
    await goToStep2(result)
    act(() => { result.current.setFirstName('Marc'); result.current.setLastName('Dupont') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toBe('Erreur serveur')
    expect(result.current.success).toBe(false)
  })
})

// ─── passwordStrengthInfo ─────────────────────────────────────────────────────
describe('useRegisterForm — passwordStrengthInfo', () => {
  it('level 0 si mot de passe vide', () => {
    const { result } = renderHook(() => useRegisterForm())
    expect(result.current.passwordStrengthInfo.level).toBe(0)
  })

  it('level 1 si moins de 8 caractères', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('abc') })
    expect(result.current.passwordStrengthInfo.level).toBe(1)
    expect(result.current.passwordStrengthInfo.label).toBe('Trop court')
  })

  it('level 2 (Faible) si 8+ caractères un seul type', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('abcdefgh') })
    expect(result.current.passwordStrengthInfo.level).toBe(2)
    expect(result.current.passwordStrengthInfo.label).toBe('Faible')
  })

  it('level 3 (Moyen) si lettres + chiffres', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('abcdef12') })
    expect(result.current.passwordStrengthInfo.level).toBe(3)
    expect(result.current.passwordStrengthInfo.label).toBe('Moyen')
  })

  it('level 4 (Fort) si majuscule + chiffre + spécial', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('Abcdef1!') })
    expect(result.current.passwordStrengthInfo.level).toBe(4)
    expect(result.current.passwordStrengthInfo.label).toBe('Fort')
  })

  it('expose les critères individuels', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('Abcdef1!') })
    const { criteria } = result.current.passwordStrengthInfo
    expect(criteria.minLength).toBe(true)
    expect(criteria.hasUpper).toBe(true)
    expect(criteria.hasNumber).toBe(true)
    expect(criteria.hasSpecial).toBe(true)
  })

  it('criteriaList expose text/color/icon pré-calculés', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('Abcdef1!') })
    const { criteriaList } = result.current.passwordStrengthInfo
    expect(criteriaList).toHaveLength(4)
    criteriaList.forEach(c => {
      expect(c.icon).toBe('✓')
      expect(c.color).toContain('teal')
    })
  })
})
