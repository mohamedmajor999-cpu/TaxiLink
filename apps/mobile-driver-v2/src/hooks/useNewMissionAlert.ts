import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { getSupabaseClient, userPrefsService } from '@taxilink/services';

import { useAuth } from './useAuth';
import { useInAppNotificationStore } from '@/components/notifications/inAppNotificationStore';
import { useMissionPopupStore } from '@/components/missions/missionPopupStore';

// Backend broadcast envoye par le trigger broadcast_mission_event sur INSERT
// d'une mission. Cf migration 20260507_missions_realtime_broadcast_no_pii.sql.
interface MissionInsertPayload {
  id: string;
  status?: string;
  departement?: string | null;
  departure?: string | null;
  type?: string | null;
}

// Hook global (monte UNE seule fois dans (driver)/_layout.tsx). Ecoute les
// nouvelles missions postees et :
//   - Sur la home (carte) : Alert.alert "Voir / Plus tard" qui prend l'ecran
//   - Sur toute autre page : banniere style WhatsApp via le store in-app
//
// Dans les deux cas, vibration courte pour signaler l'arrivee meme si le
// volume est coupe (les notifs push systeme vibrent deja toutes seules par
// leur channel ; ici on couvre le cas in-app pur via Realtime broadcast).
//
// Pop max une alerte a la fois (Alert.alert empile / le banner ecrase).
export function useNewMissionAlert() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const showBanner = useInAppNotificationStore((s) => s.show);
  const showPopup = useMissionPopupStore((s) => s.show);

  // Preferences en ref pour eviter de re-souscrire au channel quand elles
  // changent — on les lit a chaque event au lieu de les mettre en deps.
  const enabledRef = useRef(true);
  const deptsRef = useRef<string[]>([]);
  // Anti-doublon : Supabase peut livrer le meme event 2x sur une reconnexion
  // de channel. On garde les ids deja vus dans la session courante.
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    Promise.all([
      userPrefsService.getNotificationPrefs().catch(() => null),
      userPrefsService.getDeptPreferences().catch(() => [] as string[]),
    ]).then(([prefs, depts]) => {
      if (cancelled) return;
      enabledRef.current = prefs?.popupNewMission ?? true;
      deptsRef.current = depts;
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('missions-realtime', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'INSERT' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return;
        const p = payload as MissionInsertPayload;
        if (!enabledRef.current) return;
        if (p.status && p.status !== 'AVAILABLE') return;
        if (!p.id || seenIdsRef.current.has(p.id)) return;
        seenIdsRef.current.add(p.id);
        // Filtre departement : si le driver a declare des prefs et que la
        // mission n'est pas dedans, on ignore (sinon le chauffeur recevrait
        // des popups pour toute la France).
        if (deptsRef.current.length > 0 && p.departement && !deptsRef.current.includes(p.departement)) {
          return;
        }

        const where = p.departure ?? 'lieu inconnu';
        const titre = p.type === 'CPAM' ? 'Course CPAM' : 'Course privée';
        // Home (carte) = "/" sous le groupe (driver). Modal designe qui
        // prend tout l'ecran avec Voir / Plus tard, comportement explicite
        // quand le user regarde deja la carte. Sur toute autre page,
        // banniere style WhatsApp qui slide depuis le haut sans bloquer.
        const isOnHome = pathRef.current === '/' || pathRef.current === '/index';
        if (isOnHome) {
          showPopup({
            id:        p.id,
            title:     titre,
            departure: where,
            variant:   p.type === 'CPAM' ? 'cpam' : 'private',
          });
        } else {
          // Le banner declenche lui-meme Vibration.vibrate(200) a l'apparition.
          showBanner({ title: titre, body: `Départ : ${where}`, missionId: p.id, variant: 'new-mission' });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, showBanner, showPopup]);
}
