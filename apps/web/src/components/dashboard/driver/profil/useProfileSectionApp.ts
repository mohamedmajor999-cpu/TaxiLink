'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDriverStore } from '@/store/driverStore'
import { useNightModeStore, type NightModePref } from '@/store/nightModeStore'
import { useUserPrefs } from '@/store/userPrefsStore'
import { userPrefsService } from '@/services/userPrefsService'
import { DEFAULT_GPS_PREFERENCE, type GpsPreference } from '@/lib/gpsNavigation'

export function useProfileSectionApp() {
  const router = useRouter()
  const themePref = useNightModeStore((s) => s.pref)
  const setThemePref = useNightModeStore((s) => s.setPref)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gpsPref, setGpsPrefState] = useState<GpsPreference>(DEFAULT_GPS_PREFERENCE)

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
