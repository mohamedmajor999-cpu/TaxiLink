import { useState, useMemo } from 'react'
import { authService } from '@/services/authService'
import { isValidEmail, isValidPassword, isValidPhone } from '@/lib/validators'

export type StrengthLevel = 0 | 1 | 2 | 3 | 4

export interface PasswordCriteria {
  minLength:  boolean
  hasUpper:   boolean
  hasNumber:  boolean
  hasSpecial: boolean
}

export interface CriterionDisplay {
  text:  string
  color: string
  icon:  string
}

export interface PasswordStrengthInfo {
  level:      StrengthLevel
  label:      string
  segColor:   string
  labelColor: string
  criteria:   PasswordCriteria
  criteriaList: CriterionDisplay[]
}

const STRENGTH_LEVELS = [
  null,
  { label: 'Trop court', segColor: 'bg-rose-400',   labelColor: 'text-rose-400'   },
  { label: 'Faible',     segColor: 'bg-orange-300', labelColor: 'text-orange-400' },
  { label: 'Moyen',      segColor: 'bg-amber-300',  labelColor: 'text-amber-400'  },
  { label: 'Fort',       segColor: 'bg-teal-400',   labelColor: 'text-teal-500'   },
] as const

function computeStrengthInfo(pw: string): PasswordStrengthInfo {
  const criteria: PasswordCriteria = {
    minLength:  pw.length >= 8,
    hasUpper:   /[A-Z]/.test(pw),
    hasNumber:  /[0-9]/.test(pw),
    hasSpecial: /[^a-zA-Z0-9]/.test(pw),
  }

  const criteriaList: CriterionDisplay[] = [
    { text: '8 caractères min.', color: criteria.minLength  ? 'text-teal-500' : 'text-muted', icon: criteria.minLength  ? '✓' : '·' },
    { text: 'Majuscule',         color: criteria.hasUpper   ? 'text-teal-500' : 'text-muted', icon: criteria.hasUpper   ? '✓' : '·' },
    { text: 'Chiffre',           color: criteria.hasNumber  ? 'text-teal-500' : 'text-muted', icon: criteria.hasNumber  ? '✓' : '·' },
    { text: 'Caractère spécial', color: criteria.hasSpecial ? 'text-teal-500' : 'text-muted', icon: criteria.hasSpecial ? '✓' : '·' },
  ]

  if (!pw) return { level: 0, label: '', segColor: '', labelColor: '', criteria, criteriaList }
  if (!criteria.minLength) return { level: 1, ...STRENGTH_LEVELS[1]!, criteria, criteriaList }

  const typeScore = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(pw)).length
  if (typeScore <= 1) return { level: 2, ...STRENGTH_LEVELS[2]!, criteria, criteriaList }
  if (typeScore === 2) return { level: 3, ...STRENGTH_LEVELS[3]!, criteria, criteriaList }
  return                     { level: 4, ...STRENGTH_LEVELS[4]!, criteria, criteriaList }
}

export function useRegisterForm() {
  const [step, setStep] = useState<1 | 2>(1)

  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [showConfirmPw,   setShowConfirmPw]   = useState(false)

  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [phone,      setPhone]      = useState('')
  const [department, setDepartment] = useState('')

  const [step1Loading,  setStep1Loading]  = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState(false)

  const passwordStrengthInfo = useMemo(() => computeStrengthInfo(password), [password])

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email))        { setError('Adresse email invalide'); return }
    if (!isValidPassword(password))  { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return }
    setStep1Loading(true)
    try {
      await authService.beginSignUp(email, password)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setStep1Loading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) { setError('Le prénom est requis'); return }
    if (!lastName.trim())  { setError('Le nom est requis'); return }
    if (phone && !isValidPhone(phone)) { setError('Format de téléphone invalide (ex: 0601020304)'); return }
    setLoading(true)
    try {
      await authService.finalizeSignUp({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        phone:      phone || undefined,
        department: department.trim() || undefined,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      await authService.signInWithGoogle(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur Google')
      setGoogleLoading(false)
    }
  }

  return {
    step, setStep,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPw,        togglePw:        () => setShowPw((v) => !v),
    showConfirmPw, toggleConfirmPw: () => setShowConfirmPw((v) => !v),
    firstName, setFirstName,
    lastName,  setLastName,
    phone,     setPhone,
    department, setDepartment,
    step1Loading, loading, googleLoading, error, success,
    passwordStrengthInfo,
    handleNextStep, handleSubmit, handleGoogle,
  }
}
