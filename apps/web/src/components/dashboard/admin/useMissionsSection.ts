import { useEffect, useState } from 'react'
import { adminAnalyticsService, type MissionStatsReport } from '@/services/adminAnalyticsService'

export function useMissionsSection() {
  const [report, setReport] = useState<MissionStatsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminAnalyticsService
      .getMissionStats()
      .then((data) => { if (!cancelled) setReport(data) })
      .catch((err: Error) => { if (!cancelled) setError(err.message || 'Erreur chargement courses') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { report, loading, error }
}
