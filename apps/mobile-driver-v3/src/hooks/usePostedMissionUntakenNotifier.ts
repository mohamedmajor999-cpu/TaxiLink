import { useCallback, useRef } from 'react';
import { untakenMissionService } from '@taxilink/services';
import { usePostedUntakenStore } from '@taxilink/stores';

import { useAuth } from '@/hooks/useAuth';
import { useBackgroundAwareInterval } from './useBackgroundAwareInterval';

const POLL_INTERVAL_MS = 30_000;

// Polling 30s : detecte les missions postees par l'user qui n'ont pas trouve
// preneur (cf. untakenMissionService.getStuck) et alimente le store
// postedUntakenStore. Polling plutot que realtime car la detection est croisee
// (missions + mission_offers) et l'horizon "stuck" se deplace avec le temps.
//
// Pause en background : la notif "course pas prise" est une banniere in-app,
// elle ne se voit que ecran allume. Si l'user revient au foreground, le
// rattrapage est immediat (tick au reveil).
export function usePostedMissionUntakenNotifier() {
  const { user } = useAuth();
  const add = usePostedUntakenStore((s) => s.add);
  const userIdRef = useRef(user?.id ?? null);
  userIdRef.current = user?.id ?? null;

  const tick = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      const stuck = await untakenMissionService.getStuck(uid);
      for (const m of stuck) add(m);
    } catch {
      // best-effort silencieux : un poll qui rate ne bloque pas le suivant
    }
  }, [add]);

  useBackgroundAwareInterval(tick, user?.id ? POLL_INTERVAL_MS : null);
}
