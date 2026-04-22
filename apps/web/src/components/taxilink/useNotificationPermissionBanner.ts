'use client'
import { useState } from 'react'

export function useNotificationPermissionBanner() {
  const [dismissed, setDismissed] = useState(false)
  return { dismissed, dismiss: () => setDismissed(true) }
}
