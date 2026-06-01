'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Mission } from '@/lib/supabase/types'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import { useToasts } from '@/hooks/useToasts'
import { missionService } from '@/services/missionService'
import { missionViewsService } from '@/services/missionViewsService'
import { fetchOsrmRoute, type OsrmRoute } from '@/lib/osrmRoute'
import { fetchGoogleRoutesTraffic, type TrafficEstimate } from '@/lib/googleRoutes'
import { maskMissionForViewer, canSeeFullMission } from '@/lib/missionMask'
import { useMissionProgressActions } from '@/hooks/useMissionProgressActions'
import { buildSmsHref, buildGmapsHref } from './missionLinks'

interface Coords { lat: number; lng: number }

export function useMissionDetail(missionId: string) {
  const driver = useDriverStore((s) => s.driver)
  const router = useRouter()
  const { toasts, addToast, dismissToast } = useToasts()
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState<OsrmRoute | null>(null)
  const [traffic, setTraffic] = useState<TrafficEstimate | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Lecture via le RPC masqué get_mission_detail (SECURITY DEFINER) : la PII
    // patient ne quitte la base que pour l'auteur / driver assigné / client.
    // Prérequis au resserrement de la policy RLS SELECT (audit H-01). Le masquage
    // client ci-dessous reste en filet.
    missionService.getByIdMasked(missionId)
      .then((m) => {
        if (cancelled) return
        // Masque les donnees patient avant rendu pour les viewers qui ne sont
        // ni auteur, ni driver assigne, ni client (Article 9 RGPD).
        setMission(m ? maskMissionForViewer(m, driver.id || null) : null)
        setLoading(false)
        if (m && driver.id && m.shared_by !== driver.id) {
          void missionViewsService.record(m.id, driver.id)
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [missionId, driver.id])

  const isMasked = mission ? !canSeeFullMission(mission, driver.id || null) : false

  const from: Coords | null = useMemo(() => (
    mission?.departure_lat != null && mission.departure_lng != null
      ? { lat: mission.departure_lat, lng: mission.departure_lng }
      : null
  ), [mission?.departure_lat, mission?.departure_lng])

  const to: Coords | null = useMemo(() => (
    mission?.destination_lat != null && mission.destination_lng != null
      ? { lat: mission.destination_lat, lng: mission.destination_lng }
      : null
  ), [mission?.destination_lat, mission?.destination_lng])

  useEffect(() => {
    if (!from || !to) return
    const ctrl = new AbortController()
    fetchOsrmRoute({ from, to, signal: ctrl.signal }).then(setRoute).catch(() => {})
    return () => ctrl.abort()
  }, [from, to])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!apiKey || !from || !to) return
    const ctrl = new AbortController()
    fetchGoogleRoutesTraffic({
      from, to, apiKey,
      departureTime: mission?.scheduled_at ?? null,
      signal: ctrl.signal,
    }).then(setTraffic).catch(() => {})
    return () => ctrl.abort()
  }, [from, to, mission?.scheduled_at])

  const cancel = async (reason: string) => {
    if (!mission) return
    setCancelling(true)
    try {
      await missionService.cancel(mission.id, reason)
      // Dismiss store sinon banniere "course en cours" persiste jusqu'au realtime UPDATE.
      const storeCurrent = useMissionStore.getState().currentMission
      if (storeCurrent?.id === mission.id) useMissionStore.getState().dismissCurrentMission()
      router.back()
    } catch (err) {
      setCancelling(false)
      addToast({
        message: err instanceof Error ? err.message : "Impossible d'annuler la course",
        type: 'warning',
      })
    }
  }

  // No-show : flow distinct de cancel — markNoShow clot sans compter au CA.
  const [noShowOpen, setNoShowOpen] = useState(false)
  const [noShowSubmitting, setNoShowSubmitting] = useState(false)
  const noShow = async (reason: string) => {
    if (!mission) return
    setNoShowSubmitting(true)
    try {
      await missionService.markNoShow(mission.id, reason)
      const storeCurrent = useMissionStore.getState().currentMission
      if (storeCurrent?.id === mission.id) useMissionStore.getState().dismissCurrentMission()
      router.back()
    } catch (err) {
      setNoShowSubmitting(false)
      addToast({ message: err instanceof Error ? err.message : "Impossible de signaler l'absence", type: 'warning' })
    }
  }

  // Course manuelle = saisie chauffeur (ACCEPTED, ni postee, ni d'un client).
  const isManual = Boolean(mission && mission.shared_by === null && mission.client_id === null && mission.status === 'ACCEPTED')

  const [removing, setRemoving] = useState(false)
  const remove = async () => {
    if (!mission || !isManual) return
    setRemoving(true)
    try {
      await missionService.removeManual(mission.id)
      router.back()
    } catch (err) {
      setRemoving(false)
      addToast({
        message: err instanceof Error ? err.message : 'Impossible de supprimer la course',
        type: 'warning',
      })
    }
  }

  const [editOpen, setEditOpen] = useState(false)
  const applyEdit = (updated: Mission) => {
    setMission(maskMissionForViewer(updated, driver.id || null))
  }

  const complete = async () => {
    if (!mission) return
    setCompleting(true)
    try {
      await missionService.complete(mission.id)
      // Dismiss store si c'etait la course en cours (sinon banniere persiste).
      const storeCurrent = useMissionStore.getState().currentMission
      if (storeCurrent?.id === mission.id) useMissionStore.getState().dismissCurrentMission()
      router.back()
    } catch (err) {
      setCompleting(false)
      addToast({
        message: err instanceof Error ? err.message : 'Impossible de terminer la course',
        type: 'warning',
      })
    }
  }

  const [correcting, setCorrecting] = useState(false)
  const correct = async (patch: Parameters<typeof missionService.correct>[1]) => {
    if (!mission) return
    setCorrecting(true)
    try {
      const updated = await missionService.correct(mission.id, patch)
      setMission(maskMissionForViewer(updated, driver.id || null))
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Impossible de corriger la course',
        type: 'warning',
      })
    } finally {
      setCorrecting(false)
    }
  }

  const { step, advanceStep, advancing } = useMissionProgressActions(mission, setMission, (msg) =>
    addToast({ message: msg, type: 'warning' }),
  )

  const smsHref = mission?.phone
    ? buildSmsHref(mission.phone, driver.name || '')
    : null
  const wazeHref = to
    ? `https://waze.com/ul?ll=${to.lat}%2C${to.lng}&navigate=yes`
    : null
  const gmapsHref = buildGmapsHref(to, mission?.destination)

  return {
    loading, mission, isMasked, from, to, route, traffic,
    smsHref, wazeHref, gmapsHref,
    cancel, cancelling, cancelOpen, setCancelOpen,
    noShow, noShowSubmitting, noShowOpen, setNoShowOpen,
    complete, completing,
    correct, correcting,
    step, advanceStep, advancing,
    isManual, remove, removing,
    editOpen, setEditOpen, applyEdit,
    toasts, dismissToast,
  }
}

