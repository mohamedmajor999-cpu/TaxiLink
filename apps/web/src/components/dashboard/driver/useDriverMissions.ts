import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToasts } from '@/hooks/useToasts'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import { useDeptPreferences } from '@/hooks/useDeptPreferences'
import { missionService } from '@/services/missionService'
import { type MissionTypeFilter } from '@/constants/missionTypes'
import type { Mission } from '@/lib/supabase/types'

export function useDriverMissions() {
  const { user } = useAuth()
  const { toasts, addToast, dismissToast } = useToasts()
  const { depts, loading: deptsLoading } = useDeptPreferences()
  const [missions, setMissions] = useState<Mission[]>([])
  const [currentMission, setCurrentMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [filter, setFilter] = useState<MissionTypeFilter>('ALL')
  const [showConfetti, setShowConfetti] = useState(false)

  const loadMissions = useCallback(async () => {
    if (!user) return
    try {
      setError(null)
      const [available, current] = await Promise.all([
        missionService.getAvailable(depts),
        missionService.getCurrentForDriver(user.id),
      ])
      setMissions(available)
      setCurrentMission(current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les missions')
    } finally {
      setLoading(false)
    }
  }, [user, depts])

  // On attend la résolution des préférences avant le premier fetch pour
  // éviter un double load (d'abord sans filtre, puis avec).
  useEffect(() => {
    if (!deptsLoading) loadMissions()
  }, [deptsLoading, loadMissions])

  // Si les prefs sont vides, on ne filtre rien (comportement legacy).
  const matchesDeptPref = (m: Mission) => depts.length === 0 || (!!m.departement && depts.includes(m.departement))

  useMissionRealtime({
    onInsert: (m) => {
      if (!matchesDeptPref(m)) return
      addToast({
        message: 'Nouvelle mission disponible !',
        sub: `${m.departure} → ${m.destination}`,
        type: 'warning',
      })
      setMissions((prev) => (prev.some((x) => x.id === m.id) ? prev : [m, ...prev]))
    },
    onUpdate: (m) => {
      setMissions((prev) => {
        const idx = prev.findIndex((x) => x.id === m.id)
        // Sortie de la liste si la mission n'est plus disponible (acceptée/annulée/terminée)
        if (m.status !== 'AVAILABLE') {
          return idx === -1 ? prev : prev.filter((x) => x.id !== m.id)
        }
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = m
        return next
      })
      setCurrentMission((prev) => (prev?.id === m.id ? m : prev))
    },
    onDelete: ({ id }) => {
      setMissions((prev) => prev.filter((x) => x.id !== id))
      setCurrentMission((prev) => (prev?.id === id ? null : prev))
    },
  })

  const acceptMission = async (id: string) => {
    if (!user) return
    setAccepting(id)
    try {
      await missionService.accept(id, user.id)
      setShowConfetti(true)
      addToast({ message: 'Mission acceptée !', type: 'warning' })
      await loadMissions()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible d'accepter la mission"
      addToast({ message: msg, type: 'warning' })
      if (msg.includes('déjà acceptée')) await loadMissions()
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

  const clearConfetti = () => setShowConfetti(false)

  return {
    missions, currentMission, loading, error,
    accepting, filter, setFilter, filtered,
    loadMissions, acceptMission, completeMission,
    toasts, dismissToast,
    showConfetti, clearConfetti,
  }
}
