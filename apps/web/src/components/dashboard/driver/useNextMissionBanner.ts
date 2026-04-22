'use client'
import { useEffect, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'
import { computeRoute } from '@/services/addressService'
import { formatDuration, formatCountdown } from '@/lib/formatDuration'

interface Params {
  mission: Mission
  onComplete?: (id: string) => void | Promise<void>
  userCoords?: { lat: number; lng: number } | null
}

const IMMINENT_MS = 15 * 60_000
const FAST_TICK_MS = 1_000
const SLOW_TICK_MS = 30_000

type BadgeVariant = 'medical' | 'private' | 'fleet'

export function useNextMissionBanner({ mission, onComplete, userCoords }: Params) {
  const [now, setNow] = useState(() => Date.now())
  const [etaMin, setEtaMin] = useState<number | null>(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const deltaMs = new Date(mission.scheduled_at).getTime() - Date.now()
      setNow(Date.now())
      const nextDelay = Math.abs(deltaMs) < 60_000 ? FAST_TICK_MS : SLOW_TICK_MS
      timeoutId = window.setTimeout(tick, nextDelay)
    }
    let timeoutId = window.setTimeout(tick, FAST_TICK_MS)
    return () => { cancelled = true; window.clearTimeout(timeoutId) }
  }, [mission.scheduled_at])

  useEffect(() => {
    if (!userCoords) { setEtaMin(null); return }
    if (mission.departure_lat == null || mission.departure_lng == null) { setEtaMin(null); return }
    const controller = new AbortController()
    computeRoute(
      userCoords,
      { lat: mission.departure_lat, lng: mission.departure_lng },
      controller.signal,
    )
      .then((r) => setEtaMin(r.duration_min))
      .catch(() => { /* silencieux : on retombe sur le compte à rebours seul */ })
    return () => controller.abort()
  }, [userCoords, mission.departure_lat, mission.departure_lng])

  const deltaMs = new Date(mission.scheduled_at).getTime() - now
  const isStarted = deltaMs <= 0
  const isImminent = !isStarted && deltaMs <= IMMINENT_MS
  const fare = computeDisplayFare(mission)
  const badge = typeBadge(mission.type)
  const showComplete = isStarted && !!onComplete

  const barClass = isStarted
    ? 'bg-emerald-500 motion-safe:animate-pulse'
    : isImminent
      ? 'bg-brand motion-safe:animate-pulse'
      : 'bg-ink'

  const countdown = isStarted ? 'Départ maintenant' : formatCountdown(deltaMs)
  const etaText = etaMin != null && !isStarted ? `${formatDuration(etaMin)} depuis votre position` : null

  const handleComplete = async () => {
    if (!onComplete || completing) return
    setCompleting(true)
    try { await onComplete(mission.id) } finally { setCompleting(false) }
  }

  return {
    isStarted,
    fare,
    badge,
    barClass,
    countdown,
    etaText,
    showComplete,
    completing,
    handleComplete,
  }
}

function typeBadge(type: string): { variant: BadgeVariant; label: string } {
  if (type === 'CPAM') return { variant: 'medical', label: 'Médical' }
  if (type === 'PRIVE') return { variant: 'private', label: 'Privé' }
  return { variant: 'fleet', label: 'TaxiLink' }
}

