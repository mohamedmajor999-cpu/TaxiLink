import { useEffect, useState, useCallback } from 'react'
import { adminAnalyticsService, type GoogleCostItem, type GoogleCostUpsert } from '@/services/adminAnalyticsService'

export function useGoogleCostsSection() {
  const [items, setItems] = useState<GoogleCostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { items } = await adminAnalyticsService.listGoogleCosts()
      setItems(items)
    } catch (err) {
      setError((err as Error).message || 'Erreur chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const upsert = useCallback(async (input: GoogleCostUpsert) => {
    setSaving(true)
    setError(null)
    try {
      await adminAnalyticsService.upsertGoogleCost(input)
      await reload()
    } catch (err) {
      setError((err as Error).message || 'Erreur enregistrement')
    } finally {
      setSaving(false)
    }
  }, [reload])

  const remove = useCallback(async (id: number) => {
    setError(null)
    try {
      await adminAnalyticsService.deleteGoogleCost(id)
      await reload()
    } catch (err) {
      setError((err as Error).message || 'Erreur suppression')
    }
  }, [reload])

  const total = items.reduce((sum, i) => sum + Number(i.cost_usd), 0)

  return { items, total, loading, saving, error, upsert, remove }
}
