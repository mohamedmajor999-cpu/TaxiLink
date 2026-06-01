'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { useDriverStore } from '@/store/driverStore'
import { missionService } from '@/services/missionService'
import { missionOfferService, type PendingOffer } from '@/services/missionOfferService'

const POLL_INTERVAL_MS = 5_000

export interface IncomingOfferState {
  offer:        PendingOffer
  mission:      Mission
  secondsLeft:  number
}

/**
 * Détecte les offres de courses PENDING reçues par le chauffeur courant.
 * Polling 5s sur mission_offers (en attendant l'activation de la publication
 * realtime côté Supabase). Maintient un countdown live et expose accept/refuse.
 *
 * Une seule offre affichée à la fois (la plus récente non encore traitée).
 */
export function useIncomingMissionOffer() {
  const driverId = useDriverStore((s) => s.driver.id)
  const isOnline = useDriverStore((s) => s.driver.isOnline)
  const [state, setState] = useState<IncomingOfferState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dismissedIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!driverId || !isOnline) { setState(null); return }
    let cancelled = false

    const tick = async () => {
      try {
        const offers = await missionOfferService.getPendingForDriver(driverId)
        if (cancelled) return
        const fresh = offers.find((o) => !dismissedIdsRef.current.has(o.id))
        if (!fresh) return
        // RPC masqué (get_mission_detail) : l'offre porte sur une course non
        // encore acceptée → PII patient masquée côté serveur. Prérequis au
        // resserrement de la policy RLS SELECT (audit H-01).
        const mission = await missionService.getByIdMasked(fresh.mission_id)
        if (cancelled || !mission) return
        const secondsLeft = Math.max(0, Math.floor((new Date(fresh.expires_at).getTime() - Date.now()) / 1000))
        if (secondsLeft <= 0) return
        setState({ offer: fresh, mission, secondsLeft })
      } catch { /* best-effort silencieux */ }
    }
    tick()
    const id = setInterval(tick, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [driverId, isOnline])

  // Countdown ticker : recalcule secondsLeft chaque seconde, ferme à 0.
  useEffect(() => {
    if (!state) return
    const id = setInterval(() => {
      setState((prev) => {
        if (!prev) return null
        const remaining = Math.max(0, Math.floor((new Date(prev.offer.expires_at).getTime() - Date.now()) / 1000))
        if (remaining <= 0) {
          dismissedIdsRef.current.add(prev.offer.id)
          return null
        }
        return { ...prev, secondsLeft: remaining }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [state?.offer.id])

  const accept = useCallback(async () => {
    if (!state) return
    setLoading(true); setError(null)
    try {
      const res = await missionOfferService.accept(state.offer.id)
      if (!res.success) {
        setError(res.error === 'MISSION_TAKEN' ? 'Course déjà prise par un autre chauffeur.' : (res.error ?? 'Erreur'))
        dismissedIdsRef.current.add(state.offer.id)
        setState(null)
        return
      }
      dismissedIdsRef.current.add(state.offer.id)
      setState(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [state])

  const refuse = useCallback(async () => {
    if (!state) return
    setLoading(true); setError(null)
    try {
      await missionOfferService.refuse(state.offer.id)
      dismissedIdsRef.current.add(state.offer.id)
      setState(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [state])

  const dismiss = useCallback(() => {
    if (state) dismissedIdsRef.current.add(state.offer.id)
    setState(null)
  }, [state])

  return { state, loading, error, accept, refuse, dismiss }
}
