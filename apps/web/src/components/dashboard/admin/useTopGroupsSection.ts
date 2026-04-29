import { useEffect, useState } from 'react'
import { adminAnalyticsService, type GroupRanking, type GroupCounters } from '@/services/adminAnalyticsService'

export function useTopGroupsSection() {
  const [items, setItems] = useState<GroupRanking[]>([])
  const [counters, setCounters] = useState<GroupCounters | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminAnalyticsService
      .getTopGroups()
      .then(({ items, counters }) => {
        if (cancelled) return
        setItems(items)
        setCounters(counters)
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message || 'Erreur chargement') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { items, counters, loading, error }
}
