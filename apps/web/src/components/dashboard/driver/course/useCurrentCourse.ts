'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Mission } from '@/lib/supabase/types'
import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
import { missionService } from '@/services/missionService'
import { fetchOsrmRoute, type OsrmRoute } from '@/lib/osrmRoute'
import { fetchGoogleRoutesTraffic, type TrafficEstimate } from '@/lib/googleRoutes'

interface Coords { lat: number; lng: number }

export function useCurrentCourse() {
  const { user } = useAuth()
  const driver = useDriverStore((s) => s.driver)
  const router = useRouter()
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState<OsrmRoute | null>(null)
  const [traffic, setTraffic] = useState<TrafficEstimate | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    missionService.getCurrentForDriver(user.id)
      .then((m) => { if (!cancelled) { setMission(m); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

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
      router.push('/dashboard/chauffeur')
    } catch {
      setCancelling(false)
    }
  }

  const complete = async () => {
    if (!mission) return
    setCompleting(true)
    try {
      await missionService.complete(mission.id)
      router.push('/dashboard/chauffeur')
    } catch {
      setCompleting(false)
    }
  }

  const smsHref = mission?.phone ? buildSmsHref(mission.phone, driver.name || '') : null
  const wazeHref = to ? `https://waze.com/ul?ll=${to.lat}%2C${to.lng}&navigate=yes` : null
  const gmapsHref = buildGmapsHref(to, mission?.destination)

  return {
    loading, mission, from, to, route, traffic,
    smsHref, wazeHref, gmapsHref,
    cancel, cancelling, cancelOpen, setCancelOpen,
    complete, completing,
    currentUserId: user?.id ?? null,
  }
}

function buildSmsHref(phone: string, driverName: string): string {
  const clean = phone.replace(/\s/g, '')
  const body = driverName
    ? `Bonjour, je suis ${driverName}, votre chauffeur. J'arrive au point de rendez-vous.`
    : `Bonjour, je suis votre chauffeur. J'arrive au point de rendez-vous.`
  return `sms:${clean}?body=${encodeURIComponent(body)}`
}

function buildGmapsHref(to: Coords | null, fallbackAddress?: string | null): string | null {
  if (to) return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=driving`
  if (fallbackAddress) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fallbackAddress)}&travelmode=driving`
  return null
}
