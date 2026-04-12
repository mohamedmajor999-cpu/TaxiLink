import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { profileService } from '@/services/profileService'
import { authService } from '@/services/authService'

export function useDriverAuth() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [driverName, setDriverName] = useState('Chauffeur')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/auth/login'); return }

    profileService.getProfile(user.id)
      .then((profile) => {
        if (!profile) { router.push('/auth/login'); return }
        if (profile.role !== 'driver') { router.push('/dashboard/client'); return }
        setDriverName(profile.full_name ?? 'Chauffeur')
        setLoading(false)
      })
      .catch((err) => {
        console.error('[useDriverAuth] getProfile failed:', err)
        router.push('/auth/login')
      })
  }, [user, authLoading, router])

  const handleLogout = async () => {
    await authService.signOut()
    router.push('/')
  }

  return { driverName, loading, handleLogout }
}
