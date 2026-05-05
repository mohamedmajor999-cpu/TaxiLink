'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const DEBOUNCE_MS = 500

/**
 * Souscrit aux changements Supabase realtime sur une liste de tables, scope
 * a une organisation. Les events sont coalesces (debounce 500ms) pour eviter
 * un re-render par event quand plusieurs changements arrivent en rafale.
 *
 * @param orgId organization_id sur lequel filtrer (null = pas de subscription)
 * @param tables tables a surveiller (defaut : ['missions', 'drivers'])
 * @param onChange callback appele apres le debounce, generalement un reload
 */
export function useOrgRealtimeRefresh(
  orgId: string | null,
  tables: string[],
  onChange: () => void
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!orgId) return
    const supabase = createClient()

    const trigger = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(onChange, DEBOUNCE_MS)
    }

    let channel = supabase.channel(`org_realtime_${orgId}_${tables.join('_')}`)
    for (const table of tables) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `organization_id=eq.${orgId}` },
        trigger
      )
    }
    channel.subscribe()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [orgId, tables, onChange])
}
