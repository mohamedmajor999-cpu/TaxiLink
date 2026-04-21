'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Mission } from '@/lib/supabase/types'

interface UseMissionRealtimeOptions {
  /** Appelé à chaque nouvelle mission AVAILABLE insérée */
  onInsert?: (mission: Mission) => void
  /** Appelé à chaque mise à jour d'une mission */
  onUpdate?: (mission: Mission) => void
  /** Appelé à chaque suppression d'une mission (payload partiel : id uniquement) */
  onDelete?: (mission: { id: string }) => void
}

/**
 * Hook qui souscrit aux changements temps réel de la table missions via Supabase Realtime.
 * Isole toute la logique de subscription hors des composants UI.
 */
export function useMissionRealtime({ onInsert, onUpdate, onDelete }: UseMissionRealtimeOptions) {
  const stableOnInsert = useCallback(
    (mission: Mission) => onInsert?.(mission),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const stableOnUpdate = useCallback(
    (mission: Mission) => onUpdate?.(mission),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const stableOnDelete = useCallback(
    (mission: { id: string }) => onDelete?.(mission),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('missions-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'missions', filter: 'status=eq.AVAILABLE' },
        (payload) => stableOnInsert(payload.new as Mission)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'missions' },
        (payload) => stableOnUpdate(payload.new as Mission)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'missions' },
        (payload) => {
          const id = (payload.old as { id?: string } | null)?.id
          if (id) stableOnDelete({ id })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [stableOnInsert, stableOnUpdate, stableOnDelete])
}
