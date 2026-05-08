import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { profileService } from '@/services/profileService'
import { authService } from '@/services/authService'
import { isValidPhone, isValidName } from '@/lib/validators'

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
    if (!isValidName(firstName)) { setError('Le prénom ne doit contenir ni chiffres ni caractères spéciaux'); return }
    if (!lastName.trim())  { setError('Le nom est requis'); return }
    if (!isValidName(lastName)) { setError('Le nom ne doit contenir ni chiffres ni caractères spéciaux'); return }
    if (!phone.trim())     { setError('Le téléphone est requis'); return }
    if (!isValidPhone(phone)) { setError('Format de téléphone invalide (ex: 0601020304)'); return }

    setLoading(true)
    try {
      await profileService.updateProfile(userId, {
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        phone:      phone.trim(),
      })
      // Le trigger SQL met a jour app_metadata.profile_complete sur auth.users,
      // mais le JWT en cache cote client est anterieur. On force un refresh
      // pour que le middleware lise immediatement le nouveau claim et ne
      // redirige pas en boucle vers /auth/complete-profile.
      await authService.refreshSession()
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
