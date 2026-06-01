import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { missionMutations, missionQueries, userPrefsService } from '@taxilink/services';
import type { Mission } from '@taxilink/supabase-types';

import { useAuth } from './useAuth';
import { useMissionRealtimeContext } from '@/components/realtime/MissionRealtimeProvider';
import { triggerPushNotifyMissionAccepted } from '@/lib/pushNotifyTrigger';
import { scheduleMissionStartReminder } from '@/lib/missionLocalNotifications';
import { useDriverMissionsStore } from '@/lib/driverMissionsStore';

// Cache fresh window : retour sur la Carte dans cette fenetre = pas de re-fetch
// (la liste est forcement a jour grace au realtime). Au-dela, refetch en
// background tout en affichant la liste cachee immediatement.
const CACHE_FRESH_MS = 30_000;

// Récupère les missions disponibles pour le chauffeur, filtrées par ses préférences
// de départements (auth.users.raw_user_meta_data.dept_preferences). Liste vide = aucun filtre.
//
// V8 (2026-05-19) :
//   - Branchement Realtime via MissionRealtimeProvider : INSERT (AVAILABLE) ajoutees,
//     UPDATE patchee, DELETE/accepted retiree. Plus de pins "fantomes" apres la
//     prise d'une course par un collegue.
//   - Refetch au focus de l'ecran : quand le user revient sur la carte apres
//     une autre page, on recharge la liste. Corrige le bug "pins disparaissent
//     en revenant sur la carte" rapporte le 2026-05-19.
export function useDriverMissions() {
  const { user } = useAuth();
  const subscribe = useMissionRealtimeContext();
  const missions = useDriverMissionsStore((s) => s.missions);
  const storeDriverId = useDriverMissionsStore((s) => s.driverId);
  const fetchedAt = useDriverMissionsStore((s) => s.fetchedAt);
  const setStoreMissions = useDriverMissionsStore((s) => s.setMissions);
  const updateStoreMissions = useDriverMissionsStore((s) => s.updateMissions);
  // Loading = true uniquement au tout premier fetch (cache vide pour ce driver).
  // Sur remount avec cache valide, loading=false immediatement.
  const cacheValid = storeDriverId === user?.id && missions.length > 0;
  const [loading, setLoading] = useState(!cacheValid);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const depts = await userPrefsService.getDeptPreferences().catch(() => [] as string[]);
      const list = await missionQueries.getAvailable(depts);
      setStoreMissions(user.id, list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les missions');
    } finally {
      setLoading(false);
    }
  }, [user, setStoreMissions]);

  // Fetch initial au mount + a chaque changement de user. Skip si cache deja
  // chaud pour ce driver (le store survit au demontage des screens grace a
  // Zustand → retour sur Carte = render instantane).
  useEffect(() => {
    if (!user) return;
    if (storeDriverId !== user.id) {
      // Nouveau driver (ou jamais charge) → fetch obligatoire.
      void load();
      return;
    }
    // Cache du bon driver : refetch en background uniquement si vieux.
    if (Date.now() - fetchedAt > CACHE_FRESH_MS) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Refetch au focus screen, mais THROTTLE pour ne pas declencher de re-fetch
  // a chaque retour Carte. Le realtime maintient la liste a jour entre temps.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      if (Date.now() - fetchedAt < CACHE_FRESH_MS) return;
      void load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, load]),
  );

  // Realtime : patch incremental de la liste sur les events broadcastes par
  // le provider. Evite d'avoir une liste perimee entre 2 refetch.
  useEffect(() => {
    if (!subscribe || !user) return;
    const driverId = user.id;
    return subscribe({
      onInsert: (m) => {
        if (m.status !== 'AVAILABLE') return;
        updateStoreMissions(driverId, (prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      },
      onUpdate: (m) => {
        updateStoreMissions(driverId, (prev) => {
          const exists = prev.some((x) => x.id === m.id);
          // Mission qui sort de AVAILABLE (acceptee, annulee, etc.) => retirer.
          if (m.status !== 'AVAILABLE') {
            return exists ? prev.filter((x) => x.id !== m.id) : prev;
          }
          if (!exists) return [...prev, m];
          return prev.map((x) => (x.id === m.id ? { ...x, ...m } : x));
        });
      },
      onDelete: ({ id }) => {
        updateStoreMissions(driverId, (prev) => prev.filter((x) => x.id !== id));
      },
    });
  }, [subscribe, user, updateStoreMissions]);

  const acceptMission = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Non connecté');
      await missionMutations.accept(id, user.id);
      // Push notif au poster (shared_by) : "<driver> a pris ta course".
      // Fire-and-forget, ne bloque pas le refresh.
      triggerPushNotifyMissionAccepted(id);
      // Planifie la notif locale "as-tu demarre ?" (5 min apres scheduled_at).
      // Cancel automatique au markEnRoute via cancelMissionStartReminder.
      const mission = missions.find((m) => m.id === id) ?? await missionQueries.getByIdMasked(id);
      if (mission) void scheduleMissionStartReminder(mission);
      // Realtime va broadcaster un UPDATE (status AVAILABLE→IN_PROGRESS) qui
      // retirera la mission du feed automatiquement. Refetch garde pour les
      // edge cases (Realtime decroche pile a ce moment).
      await load();
    },
    [user, load, missions],
  );

  return { missions, loading, error, refresh: load, acceptMission };
}
