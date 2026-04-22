import { useState, useMemo } from 'react'
import { authService } from '@/services/authService'
import { isValidEmail, isValidPassword, isValidPhone } from '@/lib/validators'
import { computeStrengthInfo } from './passwordStrength'

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

  const confirmBorderClass = !confirmPassword
    ? 'border-line focus:border-accent'
    : password !== confirmPassword
    ? 'border-rose-300 focus:border-rose-400'
    : 'border-teal-300 focus:border-teal-400'

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email))        { setError('Adresse email invalide'); return }
    if (!isValidPassword(password))  { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return }
    setStep(2)
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
        email,
        password,
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        phone:      phone || undefined,
        department: department.trim() || undefined,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      // Si l'email est deja pris, on revient sur l'etape 1 pour permettre d'en corriger la valeur
      if (err instanceof Error && err.message.includes('déjà inscrite')) setStep(1)
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
    passwordStrengthInfo, confirmBorderClass,
    handleNextStep, handleSubmit, handleGoogle,
  }
}
