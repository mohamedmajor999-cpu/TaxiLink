import { useEffect, useState } from 'react'
import { adminAnalyticsService, type MissionsBreakdown } from '@/services/adminAnalyticsService'

export function useBreakdownSection() {
  const [data, setData] = useState<MissionsBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminAnalyticsService
      .getMissionsBreakdown()
      .then((d) => { if (!cancelled) setData(d) })
      .catch((err: Error) => { if (!cancelled) setError(err.message || 'Erreur chargement') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
