import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { earningsService, reportError } from '@taxilink/services';

import { useAuth } from './useAuth';

// GAINS-01 : "combien j'ai gagne aujourd'hui" est l'info n1 d'un VTC. Ce hook
// alimente la chip du top bar home. Refetch a CHAQUE focus de l'ecran (ex: au
// retour apres avoir termine une course) pour que le total reste a jour sans
// realtime. earnings reste null tant qu'aucune donnee (chip masquee).
export function useTodayEarnings(): { earnings: number | null; count: number } {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const uid = user?.id;
      if (!uid) return;
      let cancelled = false;
      earningsService
        .getDailyStats(uid)
        .then((d) => {
          if (cancelled) return;
          setEarnings(d.todayEarnings);
          setCount(d.todayCount);
        })
        .catch((err) => reportError(err, { tags: { phase: 'today-earnings' } }));
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  return { earnings, count };
}
