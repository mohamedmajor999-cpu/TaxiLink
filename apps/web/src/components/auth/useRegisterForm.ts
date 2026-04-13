import { useState } from 'react'
import { authService } from '@/services/authService'
import { isValidEmail, isValidPassword, isValidPhone } from '@/lib/validators'

export function useRegisterForm() {
  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [phone,           setPhone]           = useState('')
  const [department,      setDepartment]      = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [showConfirmPw,   setShowConfirmPw]   = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [googleLoading,   setGoogleLoading]   = useState(false)
  const [error,           setError]           = useState('')
  const [success,         setSuccess]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim())           { setError('Le prénom est requis'); return }
    if (!lastName.trim())            { setError('Le nom est requis'); return }
    if (!isValidEmail(email))        { setError('Adresse email invalide'); return }
    if (phone && !isValidPhone(phone)) { setError('Format de téléphone invalide (ex: 0601020304)'); return }
    if (!isValidPassword(password))  { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (password !== confirmPassword){ setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      await authService.signUp({
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
    firstName, setFirstName,
    lastName,  setLastName,
    email,     setEmail,
    phone,     setPhone,
    department, setDepartment,
    password,        setPassword,
    confirmPassword, setConfirmPassword,
    showPw,        togglePw:        () => setShowPw((v) => !v),
    showConfirmPw, toggleConfirmPw: () => setShowConfirmPw((v) => !v),
    loading, googleLoading, error, success,
    handleSubmit, handleGoogle,
  }
}
