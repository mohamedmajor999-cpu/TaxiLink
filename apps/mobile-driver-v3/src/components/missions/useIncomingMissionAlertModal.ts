import { useEffect, useRef, useState } from 'react';
import { Animated, Vibration } from 'react-native';
import { router } from 'expo-router';
import { missionMutations } from '@taxilink/services';
import { useGpsStore } from '@taxilink/stores';

import { useAuth } from '@/hooks/useAuth';
import { triggerPushNotifyMissionAccepted } from '@/lib/pushNotifyTrigger';
import { scheduleMissionStartReminder } from '@/lib/missionLocalNotifications';
import { useMissionPopupStore } from './missionPopupStore';

// Auto-dismiss apres COUNTDOWN_MS si le chauffeur n'agit pas. Aligne avec la
// duree de la barre de decompte jaune en haut du modal (visuel + comportement
// raccord). 20s = compromis : laisse le temps de lire/decider sans squatter
// l'ecran si le chauffeur est en train de conduire et ne peut pas reagir.
export const ALERT_COUNTDOWN_MS = 20_000;

export function useIncomingMissionAlertModal() {
  const data = useMissionPopupStore((s) => s.current);
  const dismiss = useMissionPopupStore((s) => s.dismiss);
  const { user } = useAuth();
  const driverCoords = useGpsStore((s) => s.coords);

  const vibratedFor = useRef<string | null>(null);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset + vibration + slide-in a chaque nouveau popup.
  // Deps minimales : mission.id seul. slideAnim/fadeAnim sont des useRef stables,
  // les inclure en deps est inutile. `data` complet en dep relancait l'effet
  // a chaque update du store, ce qui empilait des animations Animated jamais
  // .stop() (chaque .start() cree un AnimatedValue handle, ils s'accumulent).
  useEffect(() => {
    if (!data) {
      slideAnim.setValue(40);
      fadeAnim.setValue(0);
      setError(null);
      setAccepting(false);
      return;
    }
    if (vibratedFor.current !== data.mission.id) {
      vibratedFor.current = data.mission.id;
      Vibration.vibrate(200);
    }
    const anim = Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [data?.mission.id]);

  // Auto-dismiss : reset du timer a chaque nouvelle annonce. On NE coupe pas le
  // timer pendant accepting — si la mutation echoue (annonce deja prise), on
  // veut quand meme que le popup disparaisse, sinon il reste avec le spinner
  // indefiniment.
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => {
      if (!accepting) dismiss();
    }, ALERT_COUNTDOWN_MS);
    return () => clearTimeout(t);
  }, [data?.mission.id, accepting, dismiss]);

  async function handleAccept() {
    if (!user || !data) return;
    setError(null);
    setAccepting(true);
    try {
      await missionMutations.accept(data.mission.id, user.id);
      triggerPushNotifyMissionAccepted(data.mission.id);
      // Planifie la notif rappel "demarre ?" (5 min apres scheduled_at).
      void scheduleMissionStartReminder(data.mission);
      dismiss();
      router.push(`/mission/${data.mission.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Annonce déjà prise');
      setAccepting(false);
    }
  }

  return {
    data,
    accepting,
    error,
    driverCoords,
    slideAnim,
    fadeAnim,
    handleAccept,
    dismiss,
  };
}
