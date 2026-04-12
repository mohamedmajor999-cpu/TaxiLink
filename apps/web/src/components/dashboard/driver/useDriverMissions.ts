import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToasts } from '@/hooks/useToasts'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import { missionService } from '@/services/missionService'
import { type MissionTypeFilter } from '@/constants/missionTypes'
import type { Mission } from '@/lib/supabase/types'

export function useDriverMissions() {
  const { user } = useAuth()
  const { toasts, addToast, dismissToast } = useToasts()
  const [missions, setMissions] = useState<Mission[]>([])
  const [currentMission, setCurrentMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [filter, setFilter] = useState<MissionTypeFilter>('ALL')

  const loadMissions = useCallback(async () => {
    if (!user) return
    try {
      setError(null)
      const [available, current] = await Promise.all([
        missionService.getAvailable(),
        missionService.getCurrentForDriver(user.id),
      ])
      setMissions(available)
      setCurrentMission(current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les missions')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadMissions() }, [loadMissions])

  useMissionRealtime({
    onInsert: (m) => {
      addToast({
        message: 'Nouvelle mission disponible !',
        sub: `${m.departure} → ${m.destination}`,
        type: 'warning',
      })
      loadMissions()
    },
    onUpdate: () => loadMissions(),
  })

  const acceptMission = async (id: string) => {
    if (!user) return
    setAccepting(id)
    try {
      await missionService.accept(id, user.id)
      addToast({ message: 'Mission acceptée !', type: 'warning' })
      await loadMissions()
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : "Impossible d'accepter la mission",
        type: 'warning',
      })
    } finally {
      setAccepting(null)
    }
  }

  const completeMission = async (id: string) => {
    try {
      await missionService.complete(id)
      setCurrentMission(null)
      await loadMissions()
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Impossible de terminer la mission',
        type: 'warning',
      })
    }
  }

  const filtered = filter === 'ALL' ? missions : missions.filter((m) => m.type === filter)

  return {
    missions, currentMission, loading, error,
    accepting, filter, setFilter, filtered,
    loadMissions, acceptMission, completeMission,
    toasts, dismissToast,
  }
}
