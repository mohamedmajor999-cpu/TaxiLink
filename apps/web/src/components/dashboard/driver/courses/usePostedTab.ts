'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToasts } from '@/hooks/useToasts'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

export type PostedStatus = 'accepted' | 'waiting'

export interface PostedDriverProfile {
  full_name: string | null
  phone: string | null
}

export interface PostedMissionView {
  mission: Mission
  status: PostedStatus
  driverProfile?: PostedDriverProfile
}

export function usePostedTab() {
  const { user } = useAuth()
  const { toasts, addToast, dismissToast } = useToasts()
  const [missions, setMissions] = useState<Mission[]>([])
  const [profilesById, setProfilesById] = useState<Record<string, PostedDriverProfile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const missionsRef = useRef<Mission[]>([])
  useEffect(() => { missionsRef.current = missions }, [missions])

  const load = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('missions')
      .select('*')
      .eq('shared_by', uid)
      .neq('status', 'DONE')
      .order('scheduled_at', { ascending: true })
    if (e) {
      setError(e.message)
      setLoading(false)
      return
    }
    const list = data ?? []
    setMissions(list)
    setError(null)

    const driverIds = Array.from(new Set(list.map((m) => m.driver_id).filter((id): id is string => !!id)))
    if (driverIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', driverIds)
      const map: Record<string, PostedDriverProfile> = {}
      for (const p of profiles ?? []) map[p.id] = { full_name: p.full_name, phone: p.phone }
      setProfilesById(map)
    } else {
      setProfilesById({})
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    void load(user.id)
  }, [user, load])

  useMissionRealtime({
    onInsert: (m) => {
      if (user && m.shared_by === user.id) void load(user.id)
    },
    onUpdate: (m) => {
      if (!user || m.shared_by !== user.id) return
      const prev = missionsRef.current.find((x) => x.id === m.id)
      if (prev?.status === 'AVAILABLE' && m.status !== 'AVAILABLE') {
        addToast({
          message: 'Votre course a été prise !',
          sub: `${m.departure} → ${m.destination}`,
          type: 'warning',
        })
      }
      void load(user.id)
    },
  })

  const remove = useCallback(async (id: string) => {
    if (!user) return
    if (typeof window !== 'undefined'
      && !window.confirm('Supprimer cette course postée ? Cette action est irréversible.')) {
      return
    }
    setDeletingId(id)
    try {
      await missionService.remove(id)
      await load(user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }, [user, load])

  const items = useMemo<PostedMissionView[]>(
    () => missions.map((m) => ({
      mission: m,
      status: m.status === 'AVAILABLE' ? 'waiting' : 'accepted',
      driverProfile: m.driver_id ? profilesById[m.driver_id] : undefined,
    })),
    [missions, profilesById]
  )

  return { loading, error, items, remove, deletingId, toasts, dismissToast }
}
