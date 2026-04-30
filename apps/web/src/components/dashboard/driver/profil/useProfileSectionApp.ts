'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDriverStore } from '@/store/driverStore'
import { useNightModeStore, type NightModePref } from '@/store/nightModeStore'
import { useUserPrefs } from '@/store/userPrefsStore'
import { userPrefsService } from '@/services/userPrefsService'
import { DEFAULT_GPS_PREFERENCE, type GpsPreference } from '@/lib/gpsNavigation'
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
  const themePref = useNightModeStore((s) => s.pref)
  const setThemePref = useNightModeStore((s) => s.setPref)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voiceDictation, setVoiceState] = useState(true)
  const [gpsPref, setGpsPrefState] = useState<GpsPreference>(DEFAULT_GPS_PREFERENCE)

  useEffect(() => { setVoiceState(loadVoice()) }, [])

  useEffect(() => {
    let cancelled = false
    userPrefsService.getGpsPref()
      .then((p) => { if (!cancelled) setGpsPrefState(p) })
      .catch(() => { /* fallback déjà = ask */ })
    return () => { cancelled = true }
  }, [])

  const setGpsPref = (p: GpsPreference) => {
    setGpsPrefState(p)
    userPrefsService.updateGpsPref(p).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Erreur de sauvegarde GPS')
    })
  }

  const setVoiceDictation = (v: boolean) => {
    setVoiceState(v)
    try { window.localStorage.setItem(VOICE_KEY, v ? '1' : '0') } catch { /* noop */ }
  }

  const logout = async () => {
    if (loggingOut) return
    setError(null)
    setLoggingOut(true)
    try {
      await useDriverStore.getState().signOut()
      router.push('/auth/login')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la déconnexion')
      setLoggingOut(false)
    }
  }

  const popupNewMission = useUserPrefs((s) => s.popupNewMission)
  const setPopupNewMission = useUserPrefs((s) => s.setPopupNewMission)
  const geolocPushEnabled = useUserPrefs((s) => s.geolocPushEnabled)
  const setGeolocPushEnabled = useUserPrefs((s) => s.setGeolocPushEnabled)

  return {
    notifications: toggles.notifications,
    setNotifications: toggles.setNotifications,
    voiceDictation,
    setVoiceDictation,
    popupNewMission,
    setPopupNewMission,
    geolocPushEnabled,
    setGeolocPushEnabled,
    themePref,
    setThemePref: (p: NightModePref) => setThemePref(p),
    gpsPref,
    setGpsPref,
    loggingOut,
    error,
    logout,
  }
}
