import { useEffect, useState } from 'react';
import { missionQueries, reportError } from '@taxilink/services';
import { getAdState } from '@/components/courses/ads/adsHelpers';

// Prefetch leger des annonces partagees par l'utilisateur pour afficher le
// badge sur l'onglet "Annonces" sans avoir a y entrer. Compte uniquement les
// annonces ACTIVES (state=waiting) car c'est ce qui interesse au coup d'oeil.
// AnnoncesTab fait son propre fetch detaille — pas de coordination de cache.
export function useAnnoncesBadgeFetch(userId: string | null): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
    missionQueries
      .getSharedByUser(userId, cutoff)
      .then((list) => {
        if (cancelled) return;
        const now = Date.now();
        const active = list.filter((m) => getAdState(m, now) === 'waiting').length;
        setCount(active);
      })
      .catch((err) => reportError(err, { tags: { phase: 'annonces-badge-fetch' } }));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return count;
}
