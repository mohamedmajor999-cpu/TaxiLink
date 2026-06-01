import { useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'

import { authService, reportError } from '@taxilink/services'
import {
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidPhone,
  ALL_DEPARTEMENTS,
  type DepartementInfo,
} from '@taxilink/core'

export function useRegisterForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [step1Loading, setStep1Loading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Lookup nom departement -- code postal nettoye, recherche dans la liste.
  const departmentInfo = useMemo<DepartementInfo | null>(() => {
    const cleaned = department.trim().toUpperCase()
    if (!cleaned) return null
    return ALL_DEPARTEMENTS.find((d) => d.code === cleaned) ?? null
  }, [department])

  function handleNextStep() {
    setError(null)
    if (!isValidEmail(email)) {
      setError('Email invalide.')
      return
    }
    if (!isValidPassword(password)) {
      setError('Le mot de passe doit faire 8 caracteres minimum.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setStep(2)
  }

  async function handleSubmit() {
    setError(null)
    if (!isValidName(lastName)) return setError('Nom invalide.')
    if (!isValidName(firstName)) return setError('Prenom invalide.')
    if (!isValidPhone(phone)) return setError('Numero de telephone invalide (format 06xxxxxxxx).')
    if (!departmentInfo) return setError('Code departement non reconnu (ex : 13, 75, 2A).')

    setLoading(true)
    try {
      await authService.finalizeSignUp({
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/\s/g, ''),
        department: departmentInfo.code,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’inscription.'
      setError(translateAuthError(msg))
      reportError(err, { tags: { phase: 'register' } })
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email) return
    setResendLoading(true)
    try {
      await authService.resendConfirmation(email.trim().toLowerCase())
      setResendSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Echec de l’envoi.'
      setError(msg)
      reportError(err, { tags: { phase: 'register-resend' } })
    } finally {
      setResendLoading(false)
    }
  }

  function handleGoogle() {
    Alert.alert(
      'Bientot disponible',
      'L’inscription via Google arrive en Sem 11. Cree ton compte avec email + mot de passe pour l’instant.',
    )
  }

  return {
    step, setStep,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPw, togglePw: () => setShowPw((v) => !v),
    showConfirmPw, toggleConfirmPw: () => setShowConfirmPw((v) => !v),
    firstName, setFirstName,
    lastName, setLastName,
    phone, setPhone,
    department, setDepartment, departmentInfo,
    loading, step1Loading, googleLoading,
    resendLoading, resendSent,
    error, success,
    handleNextStep, handleSubmit, handleResend, handleGoogle,
  }
}

function translateAuthError(raw: string): string {
  if (/already.*registered/i.test(raw) || /deja inscrite/i.test(raw))
    return 'Cette adresse email est deja inscrite. Connectez-vous a la place.'
  if (/password/i.test(raw) && /weak/i.test(raw)) return 'Mot de passe trop faible.'
  if (/network/i.test(raw)) return 'Pas de reseau. Verifie ta connexion.'
  return raw
}
