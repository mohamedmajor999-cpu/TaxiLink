import { useEffect, useState } from 'react'
import { adminAnalyticsService, type DriverRanking } from '@/services/adminAnalyticsService'

export function useTopDriversSection() {
  const [items, setItems] = useState<DriverRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminAnalyticsService
      .getTopDrivers()
      .then(({ items }) => { if (!cancelled) setItems(items) })
      .catch((err: Error) => { if (!cancelled) setError(err.message || 'Erreur chargement') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { items, loading, error }
}
