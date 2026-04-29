import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
import { profileService } from '@/services/profileService'

export function useDriverAuth() {
  const router              = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { load, driver }    = useDriverStore()
  const [loading, setLoading] = useState(true)
  const loggingOut          = useRef(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { if (!loggingOut.current) router.push('/auth/login'); return }

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
    loggingOut.current = true
    await useDriverStore.getState().signOut()
    router.push('/')
  }

  return { driverName: driver.name, loading, handleLogout }
}
