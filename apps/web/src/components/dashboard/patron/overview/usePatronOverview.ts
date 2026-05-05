'use client'

import { useCallback, useEffect, useState } from 'react'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'
import { useOrgRealtimeRefresh } from '@/hooks/useOrgRealtimeRefresh'
import {
  patronOverviewService,
  type PatronKPIs,
  type PatronActivity,
} from '@/services/patronOverviewService'
import {
  patronFleetService,
  type PatronFleetMember,
  type PatronDocAlert,
} from '@/services/patronFleetService'

const REALTIME_TABLES = ['missions', 'drivers']

export interface PatronOverviewState {
  kpis: PatronKPIs | null
  fleet: PatronFleetMember[]
  activity: PatronActivity[]
  docAlerts: PatronDocAlert[]
  isLoading: boolean
  error: string | null
}

export function usePatronOverview(): PatronOverviewState {
  const { orgId, isLoading: orgLoading } = useCurrentOrg()
  const [state, setState] = useState<PatronOverviewState>({
    kpis: null,
    fleet: [],
    activity: [],
    docAlerts: [],
    isLoading: true,
    error: null,
  })

  const load = useCallback(async () => {
    if (!orgId) return
    try {
      const [kpis, fleet, activity, docAlerts] = await Promise.all([
        patronOverviewService.getKPIs(orgId),
        patronFleetService.getFleetPositions(orgId),
        patronOverviewService.getRecentActivity(orgId, 10),
        patronFleetService.getDocAlerts(orgId),
      ])
      setState({ kpis, fleet, activity, docAlerts, isLoading: false, error: null })
    } catch (e) {
      setState((s) => ({ ...s, isLoading: false, error: (e as Error).message }))
    }
  }, [orgId])

  useEffect(() => {
    if (orgLoading) return
    if (!orgId) {
      setState((s) => ({ ...s, isLoading: false }))
      return
    }
    load()
  }, [orgId, orgLoading, load])

  useOrgRealtimeRefresh(orgId, REALTIME_TABLES, load)

  return state
}
