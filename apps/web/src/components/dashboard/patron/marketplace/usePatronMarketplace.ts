'use client'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'
import { useOrgRealtimeRefresh } from '@/hooks/useOrgRealtimeRefresh'
import { patronMarketplaceService, type MarketplaceCourse } from '@/services/patronMarketplaceService'
import { patronCoursesService, type OrgDriver } from '@/services/patronCoursesService'

const REALTIME_TABLES = ['missions']

export function usePatronMarketplace() {
  const { user } = useAuth()
  const driverId = user?.id ?? null
  const { orgId } = useCurrentOrg()
  const [items, setItems] = useState<MarketplaceCourse[]>([])
  const [orgDrivers, setOrgDrivers] = useState<OrgDriver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!driverId) return
    try {
      const [marketplace, drivers] = await Promise.all([
        patronMarketplaceService.getMarketplace(driverId),
        orgId ? patronCoursesService.getOrgDrivers(orgId) : Promise.resolve([]),
      ])
      setItems(marketplace)
      setOrgDrivers(drivers)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [driverId, orgId])

  useEffect(() => {
    if (!driverId) { setIsLoading(false); return }
    load()
  }, [driverId, load])

  useOrgRealtimeRefresh(orgId, REALTIME_TABLES, load)

  const assign = useCallback(async (missionId: string, targetDriverId: string) => {
    await patronCoursesService.assignToDriver(missionId, targetDriverId)
    load()
  }, [load])

  return { items, orgDrivers, isLoading, error, assign }
}
