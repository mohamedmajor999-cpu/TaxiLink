import { useEffect, useState } from 'react'
import { adminAnalyticsService, type AiUsageReport } from '@/services/adminAnalyticsService'

export function useAiUsageSection() {
  const [report, setReport] = useState<AiUsageReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminAnalyticsService
      .getAiUsage()
      .then((data) => { if (!cancelled) setReport(data) })
      .catch((err: Error) => { if (!cancelled) setError(err.message || 'Erreur chargement conso IA') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { report, loading, error }
}
