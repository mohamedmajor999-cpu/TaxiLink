'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

export type PostedStatus = 'accepted' | 'waiting'

export interface PostedMissionView {
  mission: Mission
  status: PostedStatus
}

export function usePostedTab() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('missions')
      .select('*')
      .eq('shared_by', uid)
      .neq('status', 'DONE')
      .order('scheduled_at', { ascending: true })
    if (e) setError(e.message)
    else {
      setMissions(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    void load(user.id)
  }, [user, load])

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
    })),
    [missions]
  )

  return { loading, error, items, remove, deletingId }
}
