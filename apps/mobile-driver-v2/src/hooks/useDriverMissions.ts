import { useCallback, useEffect, useState } from 'react';
import { missionMutations, missionQueries, userPrefsService } from '@taxilink/services';
import type { Mission } from '@taxilink/supabase-types';

import { useAuth } from './useAuth';
import { triggerPushNotifyMissionAccepted } from '@/lib/pushNotifyTrigger';

// Récupère les missions disponibles pour le chauffeur, filtrées par ses préférences
// de départements (auth.users.raw_user_meta_data.dept_preferences). Liste vide = aucun filtre.
// Version simplifiée du hook web (apps/web/.../useDriverMissions.ts) : pas de realtime ni
// de mutations pour cette étape — uniquement fetch initial + refetch manuel.
export function useDriverMissions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const depts = await userPrefsService.getDeptPreferences().catch(() => [] as string[]);
      const list = await missionQueries.getAvailable(depts);
      setMissions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les missions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  const acceptMission = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Non connecté');
      await missionMutations.accept(id, user.id);
      // Push notif au poster (shared_by) : "<driver> a pris ta course".
      // Fire-and-forget, ne bloque pas le refresh.
      triggerPushNotifyMissionAccepted(id);
      // Recharge la liste : la mission acceptée passe en IN_PROGRESS, disparaît
      // du feed marketplace.
      await load();
    },
    [user, load],
  );

  return { missions, loading, error, refresh: load, acceptMission };
}
