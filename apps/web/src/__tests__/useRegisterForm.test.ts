import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRegisterForm } from '@/components/auth/useRegisterForm'

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockSignUp          = vi.fn()
const mockSignInWithGoogle = vi.fn()

vi.mock('@/services/authService', () => ({
  authService: {
    signUp:          (...a: unknown[]) => mockSignUp(...a),
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

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useRegisterForm — état initial', () => {
  it('démarre à l étape 1', () => {
    const { result } = renderHook(() => useRegisterForm())
    expect(result.current.step).toBe(1)
    expect(result.current.success).toBe(false)
    expect(result.current.error).toBe('')
  })
})

// ─── Étape 1 : validation des identifiants ────────────────────────────────────
describe('useRegisterForm — étape 1', () => {
  it('refuse si email invalide', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setEmail('pasunemail') })
    act(() => { result.current.handleNextStep(fakeEvent) })
    expect(result.current.error).toBe('Adresse email invalide')
    expect(result.current.step).toBe(1)
  })

  it('refuse si mot de passe trop court', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => {
      result.current.setEmail('test@test.com')
      result.current.setPassword('abc')
    })
    act(() => { result.current.handleNextStep(fakeEvent) })
    expect(result.current.error).toContain('8 caractères')
    expect(result.current.step).toBe(1)
  })

  it('refuse si les mots de passe ne correspondent pas', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => {
      result.current.setEmail('test@test.com')
      result.current.setPassword('password123')
      result.current.setConfirmPassword('autrechose')
    })
    act(() => { result.current.handleNextStep(fakeEvent) })
    expect(result.current.error).toContain('correspondent pas')
    expect(result.current.step).toBe(1)
  })

  it('passe à l étape 2 si tout est valide', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => {
      result.current.setEmail('test@test.com')
      result.current.setPassword('password123')
      result.current.setConfirmPassword('password123')
    })
    act(() => { result.current.handleNextStep(fakeEvent) })
    expect(result.current.error).toBe('')
    expect(result.current.step).toBe(2)
  })
})

// ─── Étape 2 : soumission du profil ──────────────────────────────────────────
describe('useRegisterForm — étape 2', () => {
  const goToStep2 = (result: { current: ReturnType<typeof useRegisterForm> }) => {
    act(() => {
      result.current.setEmail('test@test.com')
      result.current.setPassword('password123')
      result.current.setConfirmPassword('password123')
    })
    act(() => { result.current.handleNextStep(fakeEvent) })
  }

  it('refuse si le prénom est manquant', async () => {
    const { result } = renderHook(() => useRegisterForm())
    goToStep2(result)
    act(() => { result.current.setLastName('Dupont') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toContain('prénom')
    expect(result.current.success).toBe(false)
  })

  it('refuse si le nom est manquant', async () => {
    const { result } = renderHook(() => useRegisterForm())
    goToStep2(result)
    act(() => { result.current.setFirstName('Marc') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toContain('nom')
    expect(result.current.success).toBe(false)
  })

  it('appelle signUp avec les bons paramètres', async () => {
    mockSignUp.mockResolvedValue(undefined)
    const { result } = renderHook(() => useRegisterForm())
    goToStep2(result)
    act(() => {
      result.current.setFirstName('Marc')
      result.current.setLastName('Dupont')
      result.current.setDepartment('13')
    })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      email:      'test@test.com',
      password:   'password123',
      first_name: 'Marc',
      last_name:  'Dupont',
      department: '13',
    }))
    expect(result.current.success).toBe(true)
  })

  it('affiche une erreur si signUp echoue', async () => {
    mockSignUp.mockRejectedValue(new Error('Email déjà utilisé'))
    const { result } = renderHook(() => useRegisterForm())
    goToStep2(result)
    act(() => {
      result.current.setFirstName('Marc')
      result.current.setLastName('Dupont')
    })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toBe('Email déjà utilisé')
    expect(result.current.success).toBe(false)
  })

  it('permet de revenir à l étape 1 via setStep', () => {
    const { result } = renderHook(() => useRegisterForm())
    goToStep2(result)
    expect(result.current.step).toBe(2)
    act(() => { result.current.setStep(1) })
    expect(result.current.step).toBe(1)
  })

  it('affiche l erreur email déjà inscrit si identities vide', async () => {
    mockSignUp.mockRejectedValue(new Error('Cette adresse email est déjà inscrite. Connectez-vous ou réinitialisez votre mot de passe.'))
    const { result } = renderHook(() => useRegisterForm())
    goToStep2(result)
    act(() => { result.current.setFirstName('Marc'); result.current.setLastName('Dupont') })
    await act(async () => { await result.current.handleSubmit(fakeEvent) })
    expect(result.current.error).toContain('déjà inscrite')
    expect(result.current.success).toBe(false)
  })
})

// ─── passwordStrength ─────────────────────────────────────────────────────────
describe('useRegisterForm — passwordStrength', () => {
  it('vaut 0 si le mot de passe est vide', () => {
    const { result } = renderHook(() => useRegisterForm())
    expect(result.current.passwordStrength).toBe(0)
  })

  it('vaut 1 si moins de 8 caractères', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('abc') })
    expect(result.current.passwordStrength).toBe(1)
  })

  it('vaut 2 si 8+ caractères mais un seul type', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('abcdefgh') })
    expect(result.current.passwordStrength).toBe(2)
  })

  it('vaut 3 si 8+ caractères avec lettres + chiffres', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('abcdef12') })
    expect(result.current.passwordStrength).toBe(3)
  })

  it('vaut 4 si 8+ caractères avec majuscule + chiffre + spécial', () => {
    const { result } = renderHook(() => useRegisterForm())
    act(() => { result.current.setPassword('Abcdef1!') })
    expect(result.current.passwordStrength).toBe(4)
  })
})
