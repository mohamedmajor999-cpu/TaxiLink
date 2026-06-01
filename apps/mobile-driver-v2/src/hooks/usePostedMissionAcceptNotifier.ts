import { useEffect, useRef } from 'react';
import { getSupabaseClient, reportError } from '@taxilink/services';
import { usePostedAcceptStore } from '@taxilink/stores';

import { useAuth } from '@/hooks/useAuth';
import { useMissionRealtime } from '@/hooks/useMissionRealtime';
import { useInAppNotificationStore } from '@/components/notifications/inAppNotificationStore';

// Ecoute les UPDATE realtime sur les annonces postees par l'user. Quand une
// est acceptee (status sort de AVAILABLE + driver_id renseigne) :
//   1. Push (deja envoyee par l'edge function notify_poster_mission_accepted
//      cote chauffeur preneur — visible meme app fermee).
//   2. Banniere in-app style WhatsApp si l'app est ouverte (couvre le cas ou
//      le poster est sur une autre page que "Mes courses").
//   3. Store postedAccept (alimente le badge tab Annonces + dot hamburger,
//      visible quand le user retourne sur "Mes courses").
export function usePostedMissionAcceptNotifier() {
  const { user } = useAuth();
  const notifiedRef = useRef<Set<string>>(new Set());
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;
  const add = usePostedAcceptStore((s) => s.add);
  const showBanner = useInAppNotificationStore((s) => s.show);

  useEffect(() => {
    notifiedRef.current = new Set();
  }, [user?.id]);

  useMissionRealtime({
    onUpdate: (m) => {
      const uid = userIdRef.current;
      if (!uid) return;
      if (m.shared_by !== uid) return;
      if (m.status === 'AVAILABLE' || !m.driver_id) return;
      if (notifiedRef.current.has(m.id)) return;
      notifiedRef.current.add(m.id);
      void notifyAcceptance(m, add, showBanner);
    },
  });
}

async function notifyAcceptance(
  m: { id: string; driver_id: string | null; departure: string; destination: string; accepted_at: string | null },
  add: ReturnType<typeof usePostedAcceptStore.getState>['add'],
  showBanner: ReturnType<typeof useInAppNotificationStore.getState>['show'],
): Promise<void> {
  let driverName = 'Un chauffeur';
  let driverPhone: string | null = null;
  if (m.driver_id) {
    try {
      const supabase = getSupabaseClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', m.driver_id)
        .maybeSingle();
      if (profile?.full_name?.trim()) driverName = profile.full_name.trim();
      if (profile?.phone?.trim()) driverPhone = profile.phone.trim();
    } catch (err) {
      reportError(err, { tags: { phase: 'posted-accept-profile-fetch' } });
    }
  }

  add({
    missionId: m.id,
    departure: m.departure,
    destination: m.destination,
    acceptedAt: m.accepted_at ?? new Date().toISOString(),
    driverName,
    driverPhone,
  });

  // Banniere in-app (le hook tourne en background sur toute la session driver,
  // peu importe la page ouverte) — declenche aussi Vibration cote banner.
  showBanner({
    title: 'Annonce acceptée',
    body: `${driverName} a pris ta course ${m.departure} → ${m.destination}`,
    missionId: m.id,
    variant: 'mission-accepted',
  });
}
