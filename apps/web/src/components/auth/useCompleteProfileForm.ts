import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { profileService } from '@/services/profileService'
import { isValidPhone } from '@/lib/validators'

interface Args {
  userId: string
  initialFirstName: string
  initialLastName: string
  initialPhone: string
  redirectTo: string
}

export function useCompleteProfileForm({
  userId, initialFirstName, initialLastName, initialPhone, redirectTo,
}: Args) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName,  setLastName]  = useState(initialLastName)
  const [phone,     setPhone]     = useState(initialPhone)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) { setError('Le prénom est requis'); return }
    if (!lastName.trim())  { setError('Le nom est requis'); return }
    if (!phone.trim())     { setError('Le téléphone est requis'); return }
    if (!isValidPhone(phone)) { setError('Format de téléphone invalide (ex: 0601020304)'); return }

    setLoading(true)
    try {
      await profileService.updateProfile(userId, {
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        phone:      phone.trim(),
      })
      router.replace(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  return {
    firstName, setFirstName,
    lastName,  setLastName,
    phone,     setPhone,
    loading, error,
    handleSubmit,
  }
}
