'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { useDriverStore } from '@/store/driverStore'
import { useSettingsToggles } from './useSettingsToggles'

const VOICE_KEY = 'taxilink:driver:voiceDictation'

function loadVoice(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(VOICE_KEY)
    return raw === null ? true : raw === '1'
  } catch {
    return true
  }
}

export function useProfileSectionApp() {
  const router = useRouter()
  const toggles = useSettingsToggles()
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voiceDictation, setVoiceState] = useState(true)

  useEffect(() => { setVoiceState(loadVoice()) }, [])

  const setVoiceDictation = (v: boolean) => {
    setVoiceState(v)
    try { window.localStorage.setItem(VOICE_KEY, v ? '1' : '0') } catch { /* noop */ }
  }

  const logout = async () => {
    if (loggingOut) return
    setError(null)
    setLoggingOut(true)
    try {
      await authService.signOut()
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

  return {
    notifications: toggles.notifications,
    setNotifications: toggles.setNotifications,
    voiceDictation,
    setVoiceDictation,
    loggingOut,
    error,
    logout,
  }
}
