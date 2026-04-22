'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasSeenOnboarding } from '@/components/onboarding/useOnboardingPage'

function isStandalone() {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia('(display-mode: standalone)').matches
  const nav = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return mq || nav
}

export function PwaFirstLaunchGate() {
  const router = useRouter()

  useEffect(() => {
    if (!isStandalone()) return
    if (hasSeenOnboarding()) return
    router.replace('/onboarding')
  }, [router])

  return null
}
