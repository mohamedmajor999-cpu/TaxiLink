import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { hasSeenOnboarding } from '@/components/onboarding/useOnboardingPage'

function isStandalone() {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia('(display-mode: standalone)').matches
  const nav = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return mq || nav
}

// Gate de premier ecran quand l'app est lancee en mode PWA (standalone) :
// 1. Onboarding pas vu  -> /onboarding (decouverte)
// 2. Connecte           -> /dashboard/chauffeur (middleware redirige vers
//                          /dashboard/client si role=client)
// 3. Pas connecte       -> /auth/login
// En mode web classique (onglet navigateur), aucun redirect : on garde la
// landing publique pour les visiteurs marketing.
export function usePwaFirstLaunchGate() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!isStandalone()) return

    if (!hasSeenOnboarding()) {
      router.replace('/onboarding')
      return
    }

    router.replace(user ? '/dashboard/chauffeur' : '/auth/login')
  }, [router, user, loading])
}
