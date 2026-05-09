'use client'
import { useCallback, useEffect, useState } from 'react'

export type BrowserNotifPermission = 'default' | 'granted' | 'denied' | 'unsupported'

function readPermission(): BrowserNotifPermission {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

/**
 * Wrapper autour de l'API Notification du navigateur. Expose l'etat
 * courant + une fonction request() qui declenche le prompt natif et
 * retourne la permission resultante. Sur Firefox le prompt ne peut
 * etre declenche que dans un user gesture (click), donc l'appelant
 * doit toujours wrapper request() dans un onClick.
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<BrowserNotifPermission>('default')

  useEffect(() => {
    setPermission(readPermission())
  }, [])

  const request = useCallback(async (): Promise<BrowserNotifPermission> => {
    if (typeof Notification === 'undefined') return 'unsupported'
    if (Notification.permission !== 'default') {
      setPermission(Notification.permission)
      return Notification.permission
    }
    try {
      const res = await Notification.requestPermission()
      setPermission(res)
      return res
    } catch {
      return readPermission()
    }
  }, [])

  return {
    supported: permission !== 'unsupported',
    permission,
    request,
  }
}
