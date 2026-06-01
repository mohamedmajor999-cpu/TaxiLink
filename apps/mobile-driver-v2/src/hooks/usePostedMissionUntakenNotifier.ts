import { useEffect } from 'react';
import { untakenMissionService } from '@taxilink/services';
import { usePostedUntakenStore } from '@taxilink/stores';

import { useAuth } from '@/hooks/useAuth';

const POLL_INTERVAL_MS = 30_000;

// Polling 30s : detecte les missions postees par l'user qui n'ont pas trouve
// preneur (cf. untakenMissionService.getStuck) et alimente le store
// postedUntakenStore. Polling plutot que realtime car la detection est croisee
// (missions + mission_offers) et l'horizon "stuck" se deplace avec le temps.
//
// Le store filtre les missions deja dismissed (persistees via AsyncStorage
// au boot), donc pas de re-injection apres un swipe to dismiss.
export function usePostedMissionUntakenNotifier() {
  const { user } = useAuth();
  const add = usePostedUntakenStore((s) => s.add);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const stuck = await untakenMissionService.getStuck(user.id);
        if (cancelled) return;
        for (const m of stuck) add(m);
      } catch {
        // best-effort silencieux : un poll qui rate ne bloque pas le suivant
      }
    };
    void tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user?.id, add]);
}
