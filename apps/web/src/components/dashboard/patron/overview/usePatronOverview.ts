'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'
import { useOrgRealtimeRefresh } from '@/hooks/useOrgRealtimeRefresh'
import { createClient } from '@/lib/supabase/client'
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

// Realtime « structurel » (missions = KPIs / activite / statut in-mission).
// Les positions GPS sont gerees a part (patch direct du payload) pour NE PAS
// relancer les 4 requetes lourdes de load() a chaque ping GPS d'un chauffeur.
const REALTIME_TABLES = ['missions']
// Filet de secours si le canal realtime drop : recharge complete periodique
// (rattrape aussi le statut in-mission tant que `missions` n'est pas publie).
const FLEET_POLL_MS = 20_000

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

  // Miroir du fleet courant pour le handler realtime (closure stable).
  const fleetRef = useRef<PatronFleetMember[]>([])
  useEffect(() => { fleetRef.current = state.fleet }, [state.fleet])

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
    const pollId = setInterval(load, FLEET_POLL_MS)
    return () => clearInterval(pollId)
  }, [orgId, orgLoading, load])

  // Positions GPS en temps reel : patch direct du pin depuis le payload, sans
  // re-fetch. Realtime livre l'event en < 1s (RLS drivers_select autorise le
  // patron a lire les drivers de son org). Seuls les changements structurels
  // (nouveau chauffeur, online↔offline) declenchent une recharge complete.
  useEffect(() => {
    if (!orgId) return
    const supabase = createClient()
    let reloadTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleReload = () => {
      if (reloadTimer) return
      reloadTimer = setTimeout(() => { reloadTimer = null; load() }, 500)
    }

    const channel = supabase
      .channel(`patron_fleet_positions_${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drivers', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          const row = payload.new as {
            id?: string
            current_lat?: number | null
            current_lng?: number | null
            current_position_updated_at?: string | null
            is_online?: boolean
          }
          const id = row?.id ?? (payload.old as { id?: string })?.id
          const known = id ? fleetRef.current.find((m) => m.id === id) : undefined
          // status !== 'offline' ⇔ is_online true cote base : si ca correspond
          // toujours, c'est une simple maj de position → patch direct.
          const onlineUnchanged =
            !!known && (row.is_online == null || (known.status !== 'offline') === row.is_online)
          if (payload.eventType === 'UPDATE' && id && known && onlineUnchanged) {
            setState((s) => ({
              ...s,
              fleet: s.fleet.map((m) => m.id === id ? {
                ...m,
                lat:       row.current_lat != null ? Number(row.current_lat) : m.lat,
                lng:       row.current_lng != null ? Number(row.current_lng) : m.lng,
                updatedAt: row.current_position_updated_at ?? m.updatedAt,
              } : m),
            }))
            return
          }
          // Nouveau chauffeur / online↔offline / inconnu → recompute complet.
          scheduleReload()
        },
      )
      .subscribe()

    return () => {
      if (reloadTimer) clearTimeout(reloadTimer)
      supabase.removeChannel(channel)
    }
  }, [orgId, load])

  // Recharge complete sur changements missions (KPIs, activite, statut in-mission).
  useOrgRealtimeRefresh(orgId, REALTIME_TABLES, load)

  return state
}
