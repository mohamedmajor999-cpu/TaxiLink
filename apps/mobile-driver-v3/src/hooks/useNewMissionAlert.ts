import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { userPrefsService } from '@taxilink/services';
import type { Mission } from '@taxilink/supabase-types';

import { useAuth } from './useAuth';
import { useMissionRealtimeContext } from '@/components/realtime/MissionRealtimeProvider';
import { useInAppNotificationStore } from '@/components/notifications/inAppNotificationStore';
import { useMissionPopupStore } from '@/components/missions/missionPopupStore';
import { rememberBounded } from '@/lib/boundedSet';

// Hook global (monte UNE seule fois dans (driver)/_layout.tsx). Ecoute les
// nouvelles missions postees et :
//   - Sur la home (carte) : Alert.alert "Voir / Plus tard" qui prend l'ecran
//   - Sur toute autre page : banniere style WhatsApp via le store in-app
//
// Dans les deux cas, vibration courte pour signaler l'arrivee meme si le
// volume est coupe (les notifs push systeme vibrent deja toutes seules par
// leur channel ; ici on couvre le cas in-app pur via Realtime broadcast).
//
// V8 (2026-05-19) : ne cree plus son propre channel Supabase. Se branche sur
// le subscribe du `MissionRealtimeProvider`, qui est partage avec le reste de
// l'app (1 seul WebSocket au lieu de 2 — gain batterie radio).
export function useNewMissionAlert() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const subscribe = useMissionRealtimeContext();
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
    if (!user?.id || !subscribe) return;
    const driverId = user.id;
    const unsubscribe = subscribe({
      onInsert: (m: Mission) => {
        if (!enabledRef.current) return;
        if (m.status !== 'AVAILABLE') return;
        if (!m.id || seenIdsRef.current.has(m.id)) return;
        rememberBounded(seenIdsRef.current, m.id);
        // Filtre departement : si le driver a declare des prefs et que la
        // mission n'est pas dedans, on ignore (sinon le chauffeur recevrait
        // des popups pour toute la France).
        if (deptsRef.current.length > 0 && m.departement && !deptsRef.current.includes(m.departement)) {
          return;
        }
        // Filtre destinataires cibles : si l'annonce est en mode "Personnes
        // choisies" (target_user_ids non vide), n'affiche la popup qu'aux
        // user_ids cibles + au poster lui-meme. Sinon (target_user_ids null
        // ou vide) = mode "Tout le groupe" => tout le monde voit. Migration
        // serveur 2026-05-19 a ajoute target_user_ids au payload broadcast.
        const targets = m.target_user_ids;
        if (targets && targets.length > 0 && !targets.includes(driverId) && m.shared_by !== driverId) {
          return;
        }

        const where = m.departure ?? 'lieu inconnu';
        const titre = m.type === 'CPAM' ? 'Course CPAM' : 'Course privée';
        // Home (carte) = "/" sous le groupe (driver). Modal designe qui
        // prend tout l'ecran avec Voir / Plus tard, comportement explicite
        // quand le user regarde deja la carte. Sur toute autre page,
        // banniere style WhatsApp qui slide depuis le haut sans bloquer.
        const isOnHome = pathRef.current === '/' || pathRef.current === '/index';
        if (isOnHome) {
          showPopup({
            mission: m,
            title:   titre,
            variant: m.type === 'CPAM' ? 'cpam' : 'private',
          });
        } else {
          // Le banner declenche lui-meme Vibration.vibrate(200) a l'apparition.
          showBanner({ title: titre, body: `Départ : ${where}`, missionId: m.id, variant: 'new-mission' });
        }
      },
    });
    return unsubscribe;
  }, [user?.id, subscribe, showBanner, showPopup]);
}
