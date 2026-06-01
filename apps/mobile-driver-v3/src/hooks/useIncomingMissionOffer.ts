import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseClient, missionOfferService, missionQueries, type PendingOffer } from '@taxilink/services';
import type { Mission } from '@taxilink/supabase-types';

import { useAuth } from './useAuth';
import { useBackgroundAwareInterval } from './useBackgroundAwareInterval';
import { triggerPushNotifyMissionAccepted } from '@/lib/pushNotifyTrigger';
import { rememberBounded } from '@/lib/boundedSet';

// Fallback poll : si Realtime decroche (perte reseau, kill background),
// on rattrape les offres ratees au reveil de l'app. 60s suffit largement
// vu que la fenetre PENDING est de 20s — pire cas le user verra l'offre
// dans la minute apres reconnexion.
const FALLBACK_POLL_MS = 60_000;

export interface IncomingOfferState {
  offer: PendingOffer;
  mission: Mission;
  secondsLeft: number;
}

/**
 * Detecte les offres de courses PENDING recues par le chauffeur courant.
 *
 * V8 (2026-05-19) : abandon du poll 5s. Souscription Realtime
 * postgres_changes sur mission_offers filtree driver_id, plus un fallback
 * 60s pause-when-background pour rattraper les eventuelles desynchros.
 * Gain batterie : 12 wake-ups/min => 1 WebSocket persistant + ~1 wake/min.
 *
 * Note : pas besoin de gate sur isOnline ici. L'edge function dispatch_mission
 * ne cree d'offre QUE pour les drivers dont last_seen_at < 90s ; si offline,
 * aucune INSERT ne sera emise.
 */
export function useIncomingMissionOffer() {
  const { user } = useAuth();
  const driverId = user?.id ?? null;
  const [state, setState] = useState<IncomingOfferState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismissedIdsRef = useRef<Set<string>>(new Set());

  // Charge une offre par id (fetch mission complete) et l'affiche si
  // pas deja dismissed et pas expiree. Idempotent.
  const tryShowOffer = useCallback(async (offerId: string) => {
    if (!driverId) return;
    if (dismissedIdsRef.current.has(offerId)) return;
    try {
      const offers = await missionOfferService.getPendingForDriver(driverId);
      const fresh = offers.find((o) => o.id === offerId && !dismissedIdsRef.current.has(o.id));
      if (!fresh) return;
      const mission = await missionQueries.getByIdMasked(fresh.mission_id);
      if (!mission) return;
      const secondsLeft = Math.max(
        0,
        Math.floor((new Date(fresh.expires_at).getTime() - Date.now()) / 1000),
      );
      if (secondsLeft <= 0) return;
      setState((prev) => (prev && prev.offer.id === fresh.id ? prev : { offer: fresh, mission, secondsLeft }));
    } catch {
      // best-effort silencieux
    }
  }, [driverId]);

  // Rattrapage : recharge toutes les offres PENDING et affiche la plus
  // recente non-dismissed. Appele au mount, sur reconnexion Realtime,
  // et par le fallback poll.
  const rescan = useCallback(async () => {
    if (!driverId) return;
    try {
      const offers = await missionOfferService.getPendingForDriver(driverId);
      const fresh = offers.find((o) => !dismissedIdsRef.current.has(o.id));
      if (!fresh) return;
      void tryShowOffer(fresh.id);
    } catch {
      // best-effort
    }
  }, [driverId, tryShowOffer]);

  // === Souscription Realtime postgres_changes sur mission_offers ===
  useEffect(() => {
    if (!driverId) {
      setState(null);
      return;
    }
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`mission-offers-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mission_offers',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const offerId = (payload.new as { id?: string } | null)?.id;
          if (!offerId) return;
          void tryShowOffer(offerId);
        },
      )
      .subscribe((status) => {
        // Sur (re)connexion, rescan pour rattraper d'eventuelles offres ratees
        // pendant le downtime du WebSocket.
        if (status === 'SUBSCRIBED') void rescan();
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, tryShowOffer, rescan]);

  // === Fallback poll 60s, pause en background ===
  useBackgroundAwareInterval(rescan, driverId ? FALLBACK_POLL_MS : null);

  // Countdown ticker : recalcule secondsLeft chaque seconde, ferme a 0.
  // Reste un setInterval classique (modal visible = ecran allume).
  useEffect(() => {
    if (!state) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (!prev) return null;
        const remaining = Math.max(
          0,
          Math.floor((new Date(prev.offer.expires_at).getTime() - Date.now()) / 1000),
        );
        if (remaining <= 0) {
          rememberBounded(dismissedIdsRef.current, prev.offer.id);
          return null;
        }
        return { ...prev, secondsLeft: remaining };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state?.offer.id]);

  const accept = useCallback(async () => {
    if (!state) return;
    setLoading(true);
    setError(null);
    try {
      const acceptedMissionId = state.offer.mission_id;
      const res = await missionOfferService.accept(state.offer.id);
      if (!res.success) {
        setError(
          res.error === 'MISSION_TAKEN'
            ? 'Course déjà prise par un autre chauffeur.'
            : res.error ?? 'Erreur',
        );
        rememberBounded(dismissedIdsRef.current, state.offer.id);
        setState(null);
        return;
      }
      // Push notif au poster (shared_by) si la mission etait une annonce
      // chauffeur. Le RPC SECURITY DEFINER ignore les missions sans shared_by,
      // donc safe a appeler meme sur une mission client.
      triggerPushNotifyMissionAccepted(acceptedMissionId);
      rememberBounded(dismissedIdsRef.current, state.offer.id);
      setState(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [state]);

  const refuse = useCallback(async () => {
    if (!state) return;
    setLoading(true);
    setError(null);
    try {
      await missionOfferService.refuse(state.offer.id);
      rememberBounded(dismissedIdsRef.current, state.offer.id);
      setState(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [state]);

  const dismiss = useCallback(() => {
    if (state) rememberBounded(dismissedIdsRef.current, state.offer.id);
    setState(null);
  }, [state]);

  return { state, loading, error, accept, refuse, dismiss };
}
