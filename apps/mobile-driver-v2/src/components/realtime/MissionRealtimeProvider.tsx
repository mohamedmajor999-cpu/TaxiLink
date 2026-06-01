import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Mission } from '@taxilink/supabase-types';
import { getSupabaseClient, missionQueries, reportError } from '@taxilink/services';

export interface MissionRealtimeCallbacks {
  onInsert?: (mission: Mission) => void;
  onUpdate?: (mission: Mission) => void;
  onDelete?: (mission: { id: string }) => void;
}

type Subscription = MissionRealtimeCallbacks;
type Subscribe = (cb: Subscription) => () => void;

const MissionRealtimeContext = createContext<Subscribe | null>(null);

// M-01 (audit) : le payload broadcast est désormais traité comme MINIMAL et NON
// fiable (canal public). On ne lit que { id, status } et on RE-FETCH la mission
// complète via le RPC authentifié `get_mission_detail` (missionQueries.getByIdMasked),
// qui masque la PII patient côté serveur et n'expose prix / trajet / target_user_ids
// qu'au travers d'un appel authentifié — plus aucune donnée métier en clair sur le
// canal public. Les consommateurs (feed, alertes, notif poster, agenda) reçoivent
// toujours un objet Mission complet et restent INCHANGÉS.
type MissionEventPayload = { id?: string; status?: string | null };

// Un seul couple de channels broadcast Supabase pour tout le dashboard ; chaque
// consommateur enregistre ses callbacks dans le registry via `useMissionRealtime`.
// Le trigger Postgres `broadcast_mission_event` n'émet (côté serveur, une fois la
// migration M-01 appliquée) qu'un payload minimal ; ici on re-hydrate la mission
// complète par RPC à chaque event. Compatible aussi avec l'ancien payload riche
// (on ignore simplement ses champs métier).
export function MissionRealtimeProvider({ children }: { children: ReactNode }) {
  const subscribers = useRef(new Set<Subscription>());

  const subscribe = useMemo<Subscribe>(
    () => (cb) => {
      subscribers.current.add(cb);
      return () => {
        subscribers.current.delete(cb);
      };
    },
    [],
  );

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Re-hydrate la mission complète (masquée) à partir de son id, puis dispatch.
    // INSERT : ajoute seulement si (toujours) AVAILABLE. UPDATE : propage si visible,
    // sinon retire du feed (null = mission acceptée par un autre / plus visible pour
    // ce user ; le poster/propriétaire la récupère, lui, complète via le RPC).
    const hydrate = (id: string, kind: 'insert' | 'update') => {
      missionQueries
        .getByIdMasked(id)
        .then((m) => {
          if (kind === 'insert') {
            if (m && m.status === 'AVAILABLE') subscribers.current.forEach((s) => s.onInsert?.(m));
            return;
          }
          if (m) subscribers.current.forEach((s) => s.onUpdate?.(m));
          else subscribers.current.forEach((s) => s.onDelete?.({ id }));
        })
        .catch((err) => reportError(err, { tags: { phase: 'realtime-hydrate', kind } }));
    };

    const missionsChannel = supabase
      .channel('missions-realtime', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'INSERT' }, ({ payload }) => {
        const p = payload as MissionEventPayload | null;
        // Payload public minimal : on ne fait confiance qu'à id + status.
        if (!p?.id || p.status !== 'AVAILABLE') return;
        hydrate(p.id, 'insert');
      })
      .on('broadcast', { event: 'UPDATE' }, ({ payload }) => {
        const p = payload as MissionEventPayload | null;
        if (!p?.id) return;
        hydrate(p.id, 'update');
      })
      .on('broadcast', { event: 'DELETE' }, ({ payload }) => {
        const id = (payload as { id?: string } | null)?.id;
        if (!id) return;
        subscribers.current.forEach((s) => s.onDelete?.({ id }));
      })
      .subscribe();

    const broadcastChannel = supabase
      .channel('mission-events')
      .on('broadcast', { event: 'accepted' }, ({ payload }) => {
        const id = (payload as { id?: string } | null)?.id;
        if (!id) return;
        subscribers.current.forEach((s) => s.onDelete?.({ id }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(missionsChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, []);

  return (
    <MissionRealtimeContext.Provider value={subscribe}>
      {children}
    </MissionRealtimeContext.Provider>
  );
}

export function useMissionRealtimeContext(): Subscribe | null {
  return useContext(MissionRealtimeContext);
}
