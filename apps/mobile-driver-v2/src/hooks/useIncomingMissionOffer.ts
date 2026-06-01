import { useCallback, useEffect, useRef, useState } from 'react';
import { missionOfferService, missionQueries, type PendingOffer } from '@taxilink/services';
import type { Mission } from '@taxilink/supabase-types';

import { useAuth } from './useAuth';
import { triggerPushNotifyMissionAccepted } from '@/lib/pushNotifyTrigger';

const POLL_INTERVAL_MS = 5_000;

export interface IncomingOfferState {
  offer: PendingOffer;
  mission: Mission;
  secondsLeft: number;
}

/**
 * Detecte les offres de courses PENDING recues par le chauffeur courant.
 * Polling 5s sur mission_offers (en attendant la publication realtime cote
 * Supabase). Countdown live, expose accept/refuse.
 *
 * Une seule offre affichee a la fois (la plus recente non encore traitee).
 *
 * Note : pas besoin de gate sur isOnline ici. L'edge function dispatch_mission
 * ne cree d'offre QUE pour les drivers dont last_seen_at < 90s ; si offline,
 * getPendingForDriver retourne [] naturellement.
 */
export function useIncomingMissionOffer() {
  const { user } = useAuth();
  const driverId = user?.id ?? null;
  const [state, setState] = useState<IncomingOfferState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismissedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!driverId) {
      setState(null);
      return;
    }
    let cancelled = false;

    const tick = async () => {
      try {
        const offers = await missionOfferService.getPendingForDriver(driverId);
        if (cancelled) return;
        const fresh = offers.find((o) => !dismissedIdsRef.current.has(o.id));
        if (!fresh) return;
        // RGPD (audit H-01) : l'offre porte sur une course non encore acceptee →
        // lecture via le RPC masque get_mission_detail (PII patient masquee cote
        // serveur). Prerequis au resserrement de la policy RLS SELECT missions.
        const mission = await missionQueries.getByIdMasked(fresh.mission_id);
        if (cancelled || !mission) return;
        const secondsLeft = Math.max(
          0,
          Math.floor((new Date(fresh.expires_at).getTime() - Date.now()) / 1000),
        );
        if (secondsLeft <= 0) return;
        setState((prev) => (prev && prev.offer.id === fresh.id ? prev : { offer: fresh, mission, secondsLeft }));
      } catch {
        // best-effort silencieux : pas de spam log a chaque tick reseau pourri.
      }
    };
    void tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [driverId]);

  // Countdown ticker : recalcule secondsLeft chaque seconde, ferme a 0.
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
          dismissedIdsRef.current.add(prev.offer.id);
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
        dismissedIdsRef.current.add(state.offer.id);
        setState(null);
        return;
      }
      // Push notif au poster (shared_by) si la mission etait une annonce
      // chauffeur. Le RPC SECURITY DEFINER ignore les missions sans shared_by,
      // donc safe a appeler meme sur une mission client.
      triggerPushNotifyMissionAccepted(acceptedMissionId);
      dismissedIdsRef.current.add(state.offer.id);
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
      dismissedIdsRef.current.add(state.offer.id);
      setState(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [state]);

  const dismiss = useCallback(() => {
    if (state) dismissedIdsRef.current.add(state.offer.id);
    setState(null);
  }, [state]);

  return { state, loading, error, accept, refuse, dismiss };
}
