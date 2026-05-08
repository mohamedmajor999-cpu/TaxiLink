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
  /**
   * Nom du channel Supabase. Doit être unique par instance du hook montée en
   * parallèle : Supabase refuse `.on(...)` après `.subscribe()` sur un nom
   * existant — donc deux hooks qui veulent recevoir les mêmes events doivent
   * utiliser des noms différents.
   */
  channelName?: string
}

// Champs envoyes par le trigger broadcast_mission_event (cf. migration
// 20260507_missions_realtime_broadcast_no_pii.sql). Volontairement SANS PII :
// patient_name, phone, notes, pickup_signature_url, transport_voucher_url ne
// transitent pas par WebSocket. Le client qui en a besoin (driver assigne,
// auteur, client) doit faire un SELECT classique qui passe par RLS.
type MissionPublicPayload = Omit<
  Mission,
  'patient_name' | 'phone' | 'notes' | 'pickup_signature_url' | 'transport_voucher_url'
>

// Reconstitue un objet Mission avec PII = null. Garde l'API du hook stable
// pour les consommateurs : ils continuent de manipuler un Mission, mais les
// champs PII sont null. Pour afficher les details complets (cas legitime :
// driver assigne qui ouvre sa course en cours), refetcher via missionService.
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

/**
 * Souscrit aux events realtime sur la table missions via un canal broadcast
 * sans PII (cf. migration trigger broadcast_mission_event). Avant : pattern
 * postgres_changes envoyait le payload complet de la ligne (PII patient
 * incluses) sur le WebSocket. Maintenant : trigger Postgres broadcast un
 * sous-ensemble safe via realtime.send() sur le topic 'missions'.
 */
export function useMissionRealtime({ onInsert, onUpdate, onDelete, channelName = 'missions-realtime' }: UseMissionRealtimeOptions) {
  // Ref mise à jour à chaque render : garantit qu'on appelle toujours la
  // dernière version des callbacks (sinon closure figée au premier render,
  // où user peut encore être null → loadMissions no-op).
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete })
  callbacksRef.current = { onInsert, onUpdate, onDelete }

  useEffect(() => {
    const supabase = createClient()

    // Topic 'missions' alimente par le trigger AFTER INSERT/UPDATE/DELETE ON
    // missions. Payload reduit, zero PII patient.
    const missionsChannel = supabase
      .channel(channelName, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'INSERT' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return
        const m = publicToMission(payload as MissionPublicPayload)
        // Filtre AVAILABLE pour aligner sur l'ancien comportement postgres_changes
        // (qui filtrait au niveau de la subscription).
        if (m.status === 'AVAILABLE') callbacksRef.current.onInsert?.(m)
      })
      .on('broadcast', { event: 'UPDATE' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return
        callbacksRef.current.onUpdate?.(publicToMission(payload as MissionPublicPayload))
      })
      .on('broadcast', { event: 'DELETE' }, ({ payload }) => {
        const id = (payload as { id?: string } | null)?.id
        if (id) callbacksRef.current.onDelete?.({ id })
      })
      .subscribe()

    // Canal historique pour l'event 'accepted' broadcaste manuellement par
    // missionService.accept (defensive — couvre le cas ou le trigger UPDATE
    // ne propage pas a temps avant que d'autres chauffeurs aient rafraichi).
    const broadcastChannel = supabase
      .channel('mission-events')
      .on('broadcast', { event: 'accepted' }, ({ payload }) => {
        const id = (payload as { id?: string } | null)?.id
        if (id) callbacksRef.current.onDelete?.({ id })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(missionsChannel)
      supabase.removeChannel(broadcastChannel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName])
}
