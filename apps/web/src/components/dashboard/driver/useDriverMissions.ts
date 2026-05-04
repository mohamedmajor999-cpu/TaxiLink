import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToasts } from '@/hooks/useToasts'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import { useDeptPreferences } from '@/hooks/useDeptPreferences'
import { missionService } from '@/services/missionService'
import { type MissionTypeFilter } from '@/constants/missionTypes'
import type { Mission } from '@/lib/supabase/types'
import { usePublishedFeedbackStore } from '@/store/publishedFeedbackStore'
import { playNotificationSound } from '@/lib/playNotificationSound'
import { maskMissionForViewer } from '@/lib/missionMask'

const TYPE_LABEL: Record<'CPAM' | 'PRIVE' | 'PRESCRIPTION', string> = {
  CPAM: 'CPAM',
  PRIVE: 'Privé',
  PRESCRIPTION: 'Prescription',
}

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

  const publishedFeedback = usePublishedFeedbackStore((s) => s.feedback)
  const consumePublishedFeedback = usePublishedFeedbackStore((s) => s.consume)
  useEffect(() => {
    if (!publishedFeedback) return
    addToast({
      message: `Annonce publiée · ${TYPE_LABEL[publishedFeedback.type]}`,
      sub: `→ ${publishedFeedback.destination}`,
      trailing: publishedFeedback.priceLabel,
      type: 'publish',
    })
    consumePublishedFeedback()
  }, [publishedFeedback, addToast, consumePublishedFeedback])

  // Si les prefs sont vides, on ne filtre rien (comportement legacy).
  const matchesDeptPref = (m: Mission) => depts.length === 0 || (!!m.departement && depts.includes(m.departement))

  useMissionRealtime({
    onInsert: (m) => {
      if (!matchesDeptPref(m)) return
      // RGPD : Supabase realtime publie les colonnes brutes (patient_name,
      // phone, notes en clair). On applique maskMissionForViewer cote client
      // avant de poser la mission dans le state -> aucune PII patient n'est
      // jamais visible dans le DOM/state pour un chauffeur tiers du feed.
      const masked = maskMissionForViewer(m, user?.id ?? null)
      setMissions((prev) => (prev.some((x) => x.id === masked.id) ? prev : [masked, ...prev]))
    },
    onUpdate: (m) => {
      const masked = maskMissionForViewer(m, user?.id ?? null)
      setMissions((prev) => {
        const idx = prev.findIndex((x) => x.id === masked.id)
        // Sortie de la liste si la mission n'est plus disponible (acceptée/annulée/terminée)
        if (masked.status !== 'AVAILABLE') {
          return idx === -1 ? prev : prev.filter((x) => x.id !== masked.id)
        }
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = masked
        return next
      })
      // currentMission est la course en cours du driver lui-meme : il a le
      // droit de voir les details complets, donc on garde la version brute.
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
    // Celebration optimiste : on declenche le pouce + confettis IMMEDIATEMENT,
    // avant l'appel reseau. Si l'acceptation echoue (mission deja prise), on l'annule.
    setShowConfetti(true)
    playNotificationSound()
    try {
      await missionService.accept(id, user.id)
      await loadMissions()
    } catch (err) {
      setShowConfetti(false)
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
