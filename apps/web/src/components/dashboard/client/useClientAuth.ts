import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { profileService } from '@/services/profileService'
import { authService } from '@/services/authService'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

export function useClientAuth() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [clientName, setClientName] = useState('Client')
  const [loading, setLoading] = useState(true)
  const [missions, setMissions] = useState<Mission[]>([])
  const [missionsError, setMissionsError] = useState<string | null>(null)
  const loggingOut = useRef(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { if (!loggingOut.current) router.push('/auth/login'); return }

    Promise.all([
      profileService.getProfile(user.id),
      missionService.getClientMissions(user.id),
    ])
      .then(([profile, clientMissions]) => {
        if (profile?.role === 'driver') { router.push('/dashboard/chauffeur'); return }
        setClientName(profile?.full_name ?? 'Client')
        setMissions(clientMissions)
      })
      .catch((err) =>
        setMissionsError(err instanceof Error ? err.message : 'Erreur de chargement')
      )
      .finally(() => setLoading(false))
  }, [user, authLoading, router])

  const refreshMissions = async () => {
    if (!user) return
    try {
      setMissionsError(null)
      const data = await missionService.getClientMissions(user.id)
      setMissions(data)
    } catch (err) {
      setMissionsError(err instanceof Error ? err.message : 'Erreur de chargement')
    }
  }

  const handleLogout = async () => {
    loggingOut.current = true
    await authService.signOut()
    router.push('/')
  }

  return { clientName, loading, missions, missionsError, refreshMissions, handleLogout }
}
