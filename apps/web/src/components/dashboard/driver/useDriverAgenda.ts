import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import { isSameDay } from '@/lib/utils'
import type { Mission } from '@/lib/supabase/types'

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function useDriverAgenda() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [selected, setSelected] = useState(new Date())
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    missionService.getAgenda(user.id)
      .then(setMissions)
      .finally(() => setLoading(false))
  }, [user])

  const today      = new Date()
  const week       = Array.from({ length: 7 }, (_, i) => addDays(today, i - today.getDay() + 1))
  const dayMissions = (d: Date) => missions.filter((m) => isSameDay(new Date(m.scheduled_at), d))
  const current    = dayMissions(selected)
  const title      = selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const stats      = {
    rides:    current.length,
    km:       current.reduce((s, m) => s + (m.distance_km ?? 0), 0),
    earnings: current.reduce((s, m) => s + (m.price_eur ?? 0), 0),
  }

  return {
    week, selected, today, title, current, stats, loading,
    hasMissions: (d: Date) => dayMissions(d).length > 0,
    setSelected,
    onPrev: () => setSelected((d) => addDays(d, -7)),
    onNext: () => setSelected((d) => addDays(d, 7)),
  }
}
