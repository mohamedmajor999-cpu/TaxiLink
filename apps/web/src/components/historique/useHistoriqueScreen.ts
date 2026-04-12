'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import { missionToAgendaRide } from '@/lib/missionMapper'
import type { AgendaRide } from '@taxilink/core'

export function useHistoriqueScreen() {
  const { user } = useAuth()
  const [rides, setRides] = useState<AgendaRide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    missionService.getDoneByDriver(user.id)
      .then((data) => setRides(data.map(missionToAgendaRide)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  const totalRides = rides.length
  const totalEarnings = rides.reduce((s, r) => s + r.priceEur, 0)
  const totalKm = rides.reduce((s, r) => s + r.distanceKm, 0)

  return { rides, loading, error, totalRides, totalEarnings, totalKm }
}
