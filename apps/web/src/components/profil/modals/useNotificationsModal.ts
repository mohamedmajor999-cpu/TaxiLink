'use client'

import { useState, useEffect } from 'react'
import { authService } from '@/services/authService'

interface NotifPrefs {
  new_missions: boolean
  reminders: boolean
  sounds: boolean
  vibrations: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  new_missions: true,
  reminders: true,
  sounds: true,
  vibrations: false,
}

export function useNotificationsModal() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authService.getNotificationPrefs().then((saved) => {
      if (saved) setPrefs(saved as NotifPrefs)
    })
  }, [])

  function toggle(key: keyof NotifPrefs) {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    setSaving(true)
    authService.updateNotificationPrefs(updated).finally(() => setSaving(false))
  }

  return { prefs, toggle, saving }
}
