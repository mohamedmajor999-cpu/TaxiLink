'use client'
import { useCallback, useEffect, useState } from 'react'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'
import { useOrgRealtimeRefresh } from '@/hooks/useOrgRealtimeRefresh'
import {
  patronAgendaService,
  type AgendaDriverRow,
  type UnassignedCourse,
} from '@/services/patronAgendaService'
import { patronCoursesService, type OrgDriver } from '@/services/patronCoursesService'
import { patronFleetService, type PatronFleetMember } from '@/services/patronFleetService'

const REALTIME_TABLES = ['missions', 'drivers']

export interface PatronAgendaState {
  rows: AgendaDriverRow[]
  unassigned: UnassignedCourse[]
  orgDrivers: OrgDriver[]
  fleet: PatronFleetMember[]
  isLoading: boolean
  error: string | null
}

export function usePatronAgenda(dayIso?: string) {
  const { orgId, isLoading: orgLoading } = useCurrentOrg()
  const [state, setState] = useState<PatronAgendaState>({
    rows: [], unassigned: [], orgDrivers: [], fleet: [], isLoading: true, error: null,
  })

  const load = useCallback(() => {
    if (!orgId) return
    Promise.all([
      patronAgendaService.getDaySchedules(orgId, dayIso),
      patronCoursesService.getOrgDrivers(orgId),
      patronFleetService.getFleetPositions(orgId),
    ])
      .then(([day, orgDrivers, fleet]) =>
        setState({ rows: day.drivers, unassigned: day.unassigned, orgDrivers, fleet, isLoading: false, error: null })
      )
      .catch((e: Error) => setState((s) => ({ ...s, isLoading: false, error: e.message })))
  }, [orgId, dayIso])

  useEffect(() => {
    if (orgLoading) return
    if (!orgId) {
      setState({ rows: [], unassigned: [], orgDrivers: [], fleet: [], isLoading: false, error: null })
      return
    }
    load()
  }, [orgId, orgLoading, load])

  useOrgRealtimeRefresh(orgId, REALTIME_TABLES, load)

  const assign = useCallback(async (missionId: string, driverId: string) => {
    await patronCoursesService.assignToDriver(missionId, driverId)
    load()
  }, [load])

  const assignBatch = useCallback(async (assignments: { courseId: string; driverId: string }[]) => {
    await Promise.all(assignments.map((a) => patronCoursesService.assignToDriver(a.courseId, a.driverId)))
    load()
  }, [load])

  return { ...state, assign, assignBatch }
}
