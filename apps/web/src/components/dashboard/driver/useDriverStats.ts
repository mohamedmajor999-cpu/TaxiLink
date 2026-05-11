import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

// Hook leger : charge les courses DONE du chauffeur. Consomme par
// useDriverProfilScreen pour calculer le compteur "ce mois" du profil.
// L'onglet Stats principal utilise useStatsTab (avec sa propre logique
// d'agregation par periode).
export function useDriverStats() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    missionService.getDoneByDriver(user.id)
      .then((m) => { if (!cancelled) setMissions(m) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Impossible de charger les statistiques') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  return { missions, loading, error }
}
