import { useEffect, useState } from 'react'
import { adminAnalyticsService, type GpsTrackingReport } from '@/services/adminAnalyticsService'

export function useGpsTrackingSection() {
  const [report, setReport] = useState<GpsTrackingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminAnalyticsService
      .getGpsTracking()
      .then((data) => { if (!cancelled) setReport(data) })
      .catch((err: Error) => { if (!cancelled) setError(err.message || 'Erreur chargement suivi GPS') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { report, loading, error }
}
