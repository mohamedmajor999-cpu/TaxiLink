import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
import { profileService } from '@/services/profileService'
import { authService } from '@/services/authService'

export function useDriverAuth() {
  const router              = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { load, driver }    = useDriverStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/auth/login'); return }

    profileService.getProfile(user.id)
      .then(async (profile) => {
        if (!profile) { router.push('/auth/login'); return }
        if (profile.role !== 'driver') { router.push('/dashboard/client'); return }
        await load(user.id, user.email!)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[useDriverAuth]', err)
        router.push('/auth/login')
      })
  }, [user, authLoading, router, load])

  const handleLogout = async () => {
    await authService.signOut()
    router.push('/')
  }

  return { driverName: driver.name, loading, handleLogout }
}
