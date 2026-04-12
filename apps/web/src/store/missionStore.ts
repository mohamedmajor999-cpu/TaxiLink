import { create } from 'zustand'
import type { Mission as CoreMission } from '@taxilink/core'
import type { Mission as DbMission } from '@/lib/supabase/types'
import { missionService } from '@/services/missionService'
import { useDriverStore } from '@/store/driverStore'

type SortField = 'distance' | 'price' | 'startsIn' | null
type SortDir = 'asc' | 'desc' | 'none'

interface MissionState {
  missions: CoreMission[]
  currentMission: CoreMission | null
  isLoading: boolean
  sortField: SortField
  sortDir: SortDir
  load: (driverId: string) => Promise<void>
  acceptMission: (id: string) => Promise<void>
  completeMission: () => Promise<void>
  dismissCurrentMission: () => void
  setSortField: (field: SortField) => void
  toggleSort: (field: SortField) => void
}

function toCoreMission(m: DbMission): CoreMission {
  return {
    id: m.id,
    type: m.type as CoreMission['type'],
    status: m.status as CoreMission['status'],
    departure: m.departure,
    destination: m.destination,
    distanceKm: m.distance_km ?? 0,
    priceEur: m.price_eur ?? 0,
    scheduledAt: m.scheduled_at,
    patientName: m.patient_name ?? undefined,
    phone: m.phone ?? undefined,
    driverId: m.driver_id ?? undefined,
    createdAt: m.created_at,
  }
}

function sortMissions(missions: CoreMission[], field: SortField, dir: SortDir): CoreMission[] {
  if (!field || dir === 'none') return missions
  const sorted = [...missions].sort((a, b) => {
    if (field === 'distance') return a.distanceKm - b.distanceKm
    if (field === 'price') return a.priceEur - b.priceEur
    if (field === 'startsIn')
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    return 0
  })
  return dir === 'desc' ? sorted.reverse() : sorted
}

export const useMissionStore = create<MissionState>((set, get) => ({
  missions: [],
  currentMission: null,
  isLoading: false,
  sortField: null,
  sortDir: 'none',

  load: async (driverId) => {
    set({ isLoading: true })
    try {
      const [available, current] = await Promise.all([
        missionService.getAvailable(),
        missionService.getCurrentForDriver(driverId),
      ])
      set({
        missions: available.map(toCoreMission),
        currentMission: current ? toCoreMission(current) : null,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  acceptMission: async (id) => {
    const { missions } = get()
    const mission = missions.find((m) => m.id === id)
    if (!mission) return
    const driverId = useDriverStore.getState().driver.id
    if (!driverId) return
    await missionService.accept(id, driverId)
    set({
      currentMission: { ...mission, status: 'IN_PROGRESS', driverId },
      missions: missions.filter((m) => m.id !== id),
    })
  },

  completeMission: async () => {
    const { currentMission } = get()
    if (!currentMission?.id) return
    await missionService.complete(currentMission.id)
    set({ currentMission: null })
  },

  dismissCurrentMission: () =>
    set({ currentMission: null }),

  setSortField: (field) => set({ sortField: field }),

  toggleSort: (field) =>
    set((state) => {
      if (state.sortField !== field) {
        return { sortField: field, sortDir: 'asc' }
      }
      const nextDir: SortDir =
        state.sortDir === 'none' ? 'asc' : state.sortDir === 'asc' ? 'desc' : 'none'
      return { sortDir: nextDir }
    }),
}))

export function useSortedMissions(): CoreMission[] {
  const { missions, sortField, sortDir } = useMissionStore()
  return sortMissions(missions, sortField, sortDir)
}
