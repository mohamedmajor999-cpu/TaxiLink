'use client'

import { useEffect, useRef } from 'react'
import { useMissionRealtimeContext, type MissionRealtimeCallbacks } from '@/components/realtime/MissionRealtimeProvider'

/**
 * Souscrit aux events realtime sur les missions via le provider unique monté
 * en racine du dashboard. Avant : chaque consommateur ouvrait sa propre paire
 * de channels Supabase ({broadcast missions} + {mission-events accepted}),
 * d'où 4 abonnements WebSocket en parallèle sur le dashboard chauffeur.
 * Maintenant : 1 seule paire de channels au niveau MissionRealtimeProvider,
 * et chaque hook ne fait qu'enregistrer ses callbacks dans le registry.
 *
 * Trigger Postgres broadcast_mission_event s'occupe d'envoyer un payload SANS
 * PII patient (patient_name/phone/notes/pickup_signature_url/transport_voucher_url
 * sont null). Cf migration 20260507_missions_realtime_broadcast_no_pii.sql.
 */
export function useMissionRealtime({ onInsert, onUpdate, onDelete }: MissionRealtimeCallbacks) {
  const subscribe = useMissionRealtimeContext()
  const callbacksRef = useRef<MissionRealtimeCallbacks>({ onInsert, onUpdate, onDelete })
  callbacksRef.current = { onInsert, onUpdate, onDelete }

  useEffect(() => {
    if (!subscribe) return
    return subscribe({
      onInsert: (m) => callbacksRef.current.onInsert?.(m),
      onUpdate: (m) => callbacksRef.current.onUpdate?.(m),
      onDelete: (m) => callbacksRef.current.onDelete?.(m),
    })
  }, [subscribe])
}
