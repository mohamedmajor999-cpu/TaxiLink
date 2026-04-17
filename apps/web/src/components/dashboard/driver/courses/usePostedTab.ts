'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
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

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('missions')
      .select('*')
      .eq('shared_by', user.id)
      .neq('status', 'DONE')
      .order('scheduled_at', { ascending: true })
      .then(({ data, error: e }) => {
        if (e) setError(e.message)
        else setMissions(data ?? [])
        setLoading(false)
      })
  }, [user])

  const items = useMemo<PostedMissionView[]>(
    () => missions.map((m) => ({
      mission: m,
      status: m.status === 'AVAILABLE' ? 'waiting' : 'accepted',
    })),
    [missions]
  )

  return { loading, error, items }
}
