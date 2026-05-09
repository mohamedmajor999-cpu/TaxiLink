'use client'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import { useDriverAgendaStore } from '@/store/driverAgendaStore'

// Charge l'agenda du driver une seule fois et propage les events realtime au
// store partagé. Monté au niveau de DriverCoursesScreen pour que les onglets
// Aujourd'hui / Agenda lisent la même liste sans refetch chacun.
export function useDriverAgendaSync() {
  const { user } = useAuth()
  const load = useDriverAgendaStore((s) => s.load)
  const reset = useDriverAgendaStore((s) => s.reset)
  const removeMission = useDriverAgendaStore((s) => s.removeMission)
  const upsertById = useDriverAgendaStore((s) => s.upsertById)

  useEffect(() => {
    if (!user) {
      reset()
      return
    }
    void load(user.id)
  }, [user, load, reset])

  useMissionRealtime({
    onUpdate: (mission) => {
      if (mission.driver_id !== user?.id) return
      if (mission.status === 'DONE') {
        removeMission(mission.id)
        return
      }
      void upsertById(mission.id)
    },
    onDelete: ({ id }) => removeMission(id),
  })
}
