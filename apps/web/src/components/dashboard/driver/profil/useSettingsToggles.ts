'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'taxilink:driver:prefs'

interface Prefs {
  notifications: boolean
  autoDarkMode: boolean
}

const defaults: Prefs = { notifications: true, autoDarkMode: true }

function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return defaults
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export function useSettingsToggles() {
  const [prefs, setPrefs] = useState<Prefs>(defaults)

  useEffect(() => { setPrefs(loadPrefs()) }, [])

  const set = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* noop */ }
  }

  return {
    notifications: prefs.notifications,
    autoDarkMode: prefs.autoDarkMode,
    setNotifications: (v: boolean) => set('notifications', v),
    setAutoDarkMode: (v: boolean) => set('autoDarkMode', v),
  }
}
