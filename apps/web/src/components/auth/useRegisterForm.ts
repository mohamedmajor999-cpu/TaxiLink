import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authService } from '@/services/authService'
import { isValidEmail, isValidPassword, isValidPhone } from '@/lib/validators'

export type Role = 'driver' | 'client'

export function useRegisterForm() {
  const searchParams  = useSearchParams()
  const defaultRole   = (searchParams.get('role') as Role) ?? 'client'

  const [role,       setRole]       = useState<Role>(defaultRole)
  const [fullName,   setFullName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [proNumber,  setProNumber]  = useState('')
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email))    { setError('Adresse email invalide'); return }
    if (!isValidPassword(password)) { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (phone && !isValidPhone(phone)) { setError('Format de téléphone invalide (ex: 0601020304 ou +33601020304)'); return }
    setLoading(true)
    try {
      await authService.signUp({ email, password, full_name: fullName, role, phone, pro_number: proNumber })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return {
    role, setRole,
    fullName, setFullName,
    email,    setEmail,
    phone,    setPhone,
    proNumber, setProNumber,
    password, setPassword,
    showPw,   togglePw: () => setShowPw((v) => !v),
    loading, error, success,
    handleSubmit,
  }
}
