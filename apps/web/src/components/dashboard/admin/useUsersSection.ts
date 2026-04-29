import { useEffect, useState } from 'react'
import { adminAnalyticsService, type UserStatsReport } from '@/services/adminAnalyticsService'

export function useUsersSection() {
  const [report, setReport] = useState<UserStatsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminAnalyticsService
      .getUserStats()
      .then((data) => { if (!cancelled) setReport(data) })
      .catch((err: Error) => { if (!cancelled) setError(err.message || 'Erreur chargement utilisateurs') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { report, loading, error }
}
