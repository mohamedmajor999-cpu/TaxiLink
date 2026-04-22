'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { useDriverStore } from '@/store/driverStore'

interface State {
  loggingOut: boolean
  error: string | null
  logout: () => Promise<void>
}

export function useSettingsApp(): State {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logout = async () => {
    if (loggingOut) return
    setError(null)
    setLoggingOut(true)
    try {
      await authService.signOut()
      // Reset local driver store pour éviter les fuites d'état
      useDriverStore.setState({
        driver: {
          id: '',
          name: 'Chauffeur',
          email: '',
          cpamEnabled: false,
          rating: 0,
          totalRides: 0,
          isOnline: false,
          createdAt: new Date().toISOString(),
        },
        isLoading: false,
      })
      router.push('/auth/login')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la déconnexion')
      setLoggingOut(false)
    }
  }

  return { loggingOut, error, logout }
}
