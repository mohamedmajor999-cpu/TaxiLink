'use client'
import { useCallback, useEffect, useState } from 'react'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'
import { useOrgRealtimeRefresh } from '@/hooks/useOrgRealtimeRefresh'
import { patronFinancesService, type FinanceKPIs, type FinanceMission } from '@/services/patronFinancesService'

const REALTIME_TABLES = ['missions']

export function usePatronFinances() {
  const { orgId, isLoading: orgLoading } = useCurrentOrg()
  const [kpis, setKpis] = useState<FinanceKPIs | null>(null)
  const [recentCpam, setRecentCpam] = useState<FinanceMission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    try {
      const [k, r] = await Promise.all([
        patronFinancesService.getFinances(orgId),
        patronFinancesService.getRecentCpamMissions(orgId, 20),
      ])
      setKpis(k)
      setRecentCpam(r)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    if (orgLoading) return
    if (!orgId) {
      setIsLoading(false)
      return
    }
    load()
  }, [orgId, orgLoading, load])

  useOrgRealtimeRefresh(orgId, REALTIME_TABLES, load)

  return { kpis, recentCpam, isLoading, error }
}
