'use client'

import { useEffect, useRef } from 'react'
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
  // Ref mise à jour à chaque render : garantit qu'on appelle toujours la
  // dernière version des callbacks (sinon closure figée au premier render,
  // où user peut encore être null → loadMissions no-op).
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete })
  callbacksRef.current = { onInsert, onUpdate, onDelete }

  useEffect(() => {
    const supabase = createClient()

    const pgChannel = supabase
      .channel('missions-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'missions', filter: 'status=eq.AVAILABLE' },
        (payload) => callbacksRef.current.onInsert?.(payload.new as Mission)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'missions' },
        (payload) => callbacksRef.current.onUpdate?.(payload.new as Mission)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'missions' },
        (payload) => {
          const id = (payload.old as { id?: string } | null)?.id
          if (id) callbacksRef.current.onDelete?.({ id })
        }
      )
      .subscribe()

    // Broadcast: l'event UPDATE natif est filtre par RLS quand la mission
    // passe a IN_PROGRESS (la policy SELECT ne retourne plus la ligne pour
    // les autres chauffeurs). missionService.accept() broadcast sur ce
    // canal pour leur dire de retirer la mission de leur liste locale.
    const broadcastChannel = supabase
      .channel('mission-events')
      .on('broadcast', { event: 'accepted' }, ({ payload }) => {
        const id = (payload as { id?: string } | null)?.id
        if (id) callbacksRef.current.onDelete?.({ id })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(pgChannel)
      supabase.removeChannel(broadcastChannel)
    }
  }, [])
}
