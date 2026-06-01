import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from 'react-native'
import * as Location from 'expo-location'

import {
  driverService,
  getSupabaseClient,
  missionQueries,
  missionMutations,
  reportError,
} from '@taxilink/services'
import type { Mission } from '@taxilink/supabase-types'

import { useAuth } from '@/hooks/useAuth'
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat'
import type { MissionFilter } from './FilterChips'

type MissionPublicPayload = Omit<
  Mission,
  'patient_name' | 'phone' | 'notes' | 'pickup_signature_url' | 'transport_voucher_url'
>

function publicToMission(p: MissionPublicPayload): Mission {
  return {
    ...(p as unknown as Mission),
    patient_name: null,
    phone: null,
    notes: null,
    pickup_signature_url: null,
    transport_voucher_url: null,
  }
}

const URGENT_THRESHOLD_MIN = 10
const NEAR_THRESHOLD_KM = 5

export function useDriverMissionsScreen() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<MissionFilter>('all')
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [accepting, setAccepting] = useState(false)

  // Charge l'etat is_online depuis la BD au mount. Si le user n'est jamais
  // passe en ligne, la colonne drivers vaut false par defaut.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    driverService.getDriver(user.id).then((d) => {
      if (!cancelled && d?.is_online) setIsOnline(true)
    }).catch((err) => reportError(err, { tags: { phase: 'driver-load' } }))
    return () => { cancelled = true }
  }, [user])

  // Heartbeat backend toutes les 60s tant qu'isOnline (auto-cleanup)
  useDriverHeartbeat(user?.id, isOnline)

  const toggleOnline = useCallback(async () => {
    if (!user) return
    const next = !isOnline
    setIsOnline(next) // optimistic
    try {
      await driverService.setOnline(user.id, next)
    } catch (err) {
      setIsOnline(!next) // rollback
      reportError(err, { tags: { phase: 'set-online' } })
    }
  }, [user, isOnline])

  const deptPrefs: string[] = Array.isArray(user?.user_metadata?.dept_preferences)
    ? (user!.user_metadata!.dept_preferences as string[])
    : []
  const deptPrefsRef = useRef(deptPrefs)
  deptPrefsRef.current = deptPrefs

  const inDeptScope = useCallback((m: Pick<Mission, 'departement'>) => {
    const prefs = deptPrefsRef.current
    if (prefs.length === 0) return true
    return m.departement != null && prefs.includes(m.departement)
  }, [])

  // GPS foreground best-effort (non bloquant si refus)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') return
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        if (!cancelled) setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      } catch (err) {
        reportError(err, { tags: { phase: 'missions-gps' } })
      }
    })()
    return () => { cancelled = true }
  }, [])

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await missionQueries.getAvailable(deptPrefs)
      setMissions(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement.'
      setError(msg)
      reportError(err, { tags: { phase: 'missions-load' } })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [deptPrefs])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    load()
  }, [user, load])

  // Realtime
  useEffect(() => {
    if (!user) return
    const supabase = getSupabaseClient()

    const missionsChannel = supabase
      .channel('missions-realtime-mobile', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'INSERT' }, ({ payload }: { payload: unknown }) => {
        if (!payload || typeof payload !== 'object') return
        const m = publicToMission(payload as MissionPublicPayload)
        if (m.status !== 'AVAILABLE') return
        if (!inDeptScope(m)) return
        setMissions((prev) => prev.some((p) => p.id === m.id) ? prev : [m, ...prev])
      })
      .on('broadcast', { event: 'UPDATE' }, ({ payload }: { payload: unknown }) => {
        if (!payload || typeof payload !== 'object') return
        const m = publicToMission(payload as MissionPublicPayload)
        setMissions((prev) => {
          if (m.status !== 'AVAILABLE') return prev.filter((p) => p.id !== m.id)
          if (!inDeptScope(m)) return prev.filter((p) => p.id !== m.id)
          return prev.map((p) => (p.id === m.id ? m : p))
        })
      })
      .on('broadcast', { event: 'DELETE' }, ({ payload }: { payload: unknown }) => {
        const id = (payload as { id?: string } | null)?.id
        if (!id) return
        setMissions((prev) => prev.filter((p) => p.id !== id))
      })
      .subscribe()

    const eventsChannel = supabase
      .channel('mission-events-mobile')
      .on('broadcast', { event: 'accepted' }, ({ payload }: { payload: unknown }) => {
        const id = (payload as { id?: string } | null)?.id
        if (!id) return
        setMissions((prev) => prev.filter((p) => p.id !== id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(missionsChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [user, inDeptScope])

  // Computed : counts par filtre + missions filtrees
  const counts = useMemo<Record<MissionFilter, number>>(() => {
    const all = missions.length
    const CPAM = missions.filter((m) => m.type === 'CPAM').length
    const PRIVE = missions.filter((m) => m.type === 'PRIVE').length
    const urgent = missions.filter((m) => getMinutesUntil(m.scheduled_at) <= URGENT_THRESHOLD_MIN).length
    const near = userCoords
      ? missions.filter((m) => {
          if (m.departure_lat == null || m.departure_lng == null) return false
          return haversineKm(userCoords, { lat: Number(m.departure_lat), lng: Number(m.departure_lng) }) <= NEAR_THRESHOLD_KM
        }).length
      : 0
    return { all, CPAM, PRIVE, urgent, near }
  }, [missions, userCoords])

  const filteredMissions = useMemo(() => {
    switch (filter) {
      case 'CPAM': return missions.filter((m) => m.type === 'CPAM')
      case 'PRIVE': return missions.filter((m) => m.type === 'PRIVE')
      case 'urgent': return missions.filter((m) => getMinutesUntil(m.scheduled_at) <= URGENT_THRESHOLD_MIN)
      case 'near':
        if (!userCoords) return []
        return missions.filter((m) => {
          if (m.departure_lat == null || m.departure_lng == null) return false
          return haversineKm(userCoords, { lat: Number(m.departure_lat), lng: Number(m.departure_lng) }) <= NEAR_THRESHOLD_KM
        })
      default: return missions
    }
  }, [missions, filter, userCoords])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await load()
  }, [load])

  const accept = useCallback(async (missionId: string) => {
    if (!user) return
    setAccepting(true)
    try {
      await missionMutations.accept(missionId, user.id)
      Alert.alert('Course acceptee', 'Tu es maintenant en route.')
      // La course disparaitra de la liste via le broadcast `accepted`.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Echec de l’acceptation.'
      Alert.alert('Impossible d’accepter', msg)
      reportError(err, { tags: { phase: 'missions-accept' } })
    } finally {
      setAccepting(false)
    }
  }, [user])

  return {
    missions: filteredMissions,
    allMissions: missions,
    loading,
    refreshing,
    error,
    selectedId,
    setSelectedId,
    filter,
    setFilter,
    counts,
    userCoords,
    isOnline,
    toggleOnline,
    refresh,
    accept,
    accepting,
  }
}

function getMinutesUntil(iso: string | null): number {
  if (!iso) return 9999
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000)
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}
