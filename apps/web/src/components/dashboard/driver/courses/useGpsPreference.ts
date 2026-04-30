'use client'
import { useEffect, useState } from 'react'
import { userPrefsService } from '@/services/userPrefsService'
import { DEFAULT_GPS_PREFERENCE, type GpsPreference } from '@/lib/gpsNavigation'

export function useGpsPreference() {
  const [pref, setPref] = useState<GpsPreference>(DEFAULT_GPS_PREFERENCE)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    userPrefsService.getGpsPref()
      .then((p) => { if (!cancelled) setPref(p) })
      .catch(() => { /* fallback déjà = ask */ })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [])

  return { pref, loaded }
}
