import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { driverService, reportError } from '@taxilink/services';

import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/navigation/BottomNav';
import { IncomingMissionAlertModal } from '@/components/missions/IncomingMissionAlertModal';
import { IncomingMissionOfferModal } from '@/components/missions/IncomingMissionOfferModal';
import { InAppNotificationBanner } from '@/components/notifications/InAppNotificationBanner';
import { MissionRealtimeProvider } from '@/components/realtime/MissionRealtimeProvider';
import { useBatteryOptimizationOptOut } from '@/hooks/useBatteryOptimizationOptOut';
import { useDriverGpsTracking } from '@/hooks/useDriverGpsTracking';
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat';
import { useDriverOnlineTracking } from '@/hooks/useDriverOnlineTracking';
import { useGeolocPref } from '@/hooks/useGeolocPref';
import { useNewMissionAlert } from '@/hooks/useNewMissionAlert';
import { usePostedMissionAcceptNotifier } from '@/hooks/usePostedMissionAcceptNotifier';
import { usePostedMissionUntakenNotifier } from '@/hooks/usePostedMissionUntakenNotifier';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { useDriverOnlineStore } from '@/lib/driverOnlineStore';

// Driver group : écrans accessibles UNIQUEMENT loggé.
// Si user non loggé → redirect vers /login.
export default function DriverLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bgsoft">
        <ActivityIndicator size="large" color="#FFD23F" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  // Provider realtime monte une seule fois pour toute la session driver :
  // 1 paire de channels Supabase pour tous les ecrans (vs 1 par hook avant).
  // Les notifiers d'annonces tournent en background sur toute la session.
  return (
    <MissionRealtimeProvider>
      <DriverNotifiersBridge />
      <Stack screenOptions={{ headerShown: false }} />
      {/* Modal global "Course dispo" : actif sur tous les ecrans driver.
          Cascade dispatch_mission (3 → 6 → 12 → 20 → 30 km, 20s/palier). */}
      <IncomingMissionOfferModal />
      {/* Modal "Nouvelle annonce" affiche quand un broadcast INSERT arrive
          et que le user regarde la home — remplace l'Alert.alert natif. */}
      <IncomingMissionAlertModal />
      {/* Banniere in-app style WhatsApp : slide depuis le haut quand une
          nouvelle notif arrive et que le user n'est pas sur la home. */}
      <InAppNotificationBanner />
      {/* Bottom nav fixe en bas, overlay sur tous les ecrans du group (driver).
          Auto-hide sur les routes plein-ecran (mission active, poster modal, etc.) :
          cf. HIDDEN_PATHS dans BottomNav.tsx. Le FAB jaune central ouvre /poster-course. */}
      <BottomNav />
    </MissionRealtimeProvider>
  );
}

// Pont sans rendu : monte les hooks globaux de la session driver (notifs +
// GPS tracking + tracking en ligne + heartbeat). Place sous
// MissionRealtimeProvider pour que usePostedMissionAcceptNotifier puisse lire
// le contexte realtime.
//
// useDriverGpsTracking, useDriverOnlineTracking et useDriverHeartbeat sont
// hisses ici (et non dans chaque ecran qui consomme la position) pour deux
// raisons :
//   1. UNE seule souscription GPS pour toute la session : le tri proximite,
//      la carte et le push DB lisent tous useGpsStore.
//   2. La BottomNav v3 demonte la home des qu'on tape sur un onglet. Si le
//      tracking en ligne + heartbeat vivaient sur la home (comme avant), le
//      foregroundService GPS et le ping last_seen_at tombaient a chaque
//      navigation → DB marquait le chauffeur offline en 3 min, plus d'offres.
function DriverNotifiersBridge() {
  const { user } = useAuth();
  const { enabled: geolocEnabled } = useGeolocPref();
  const isOnline = useDriverOnlineStore((s) => s.isOnline);
  const setIsOnline = useDriverOnlineStore((s) => s.setIsOnline);
  const courseState = useDriverOnlineStore((s) => s.courseState);

  // Reconciliation cold-start de isOnline entre local (persiste AsyncStorage)
  // et DB. L'intent du user prime : s'il a clique "En ligne" puis force-close
  // l'app, le cron offline-after a pu flip is_online=false cote DB pendant
  // qu'il etait absent. Au prochain cold start, on detecte ce desaccord et on
  // re-flip la DB a true (l'user n'a JAMAIS clique "Hors ligne"). Si l'user
  // a explicitement clique offline (local=false), on respecte ce choix meme
  // si la DB dit true (cas rare : crash apres setIsOnline mais avant le
  // round-trip DB). Demande user 2026-05-25 "stay online tant que je ne
  // clique pas sur hors ligne".
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const localIsOnline = useDriverOnlineStore.getState().isOnline;
    driverService
      .getDriver(user.id)
      .then(async (d) => {
        if (cancelled) return;
        const dbIsOnline = d?.is_online ?? false;
        if (localIsOnline && !dbIsOnline) {
          // Local dit online, DB dit offline (cron a flip pendant l'absence).
          // On re-flip la DB pour honorer l'intent du user.
          try {
            await driverService.setOnline(user.id, true);
          } catch (err) {
            reportError(err, { tags: { phase: 'layout-online-resync-db' } });
          }
          // Pas de setIsOnline : le store est deja a true (persiste).
        } else if (!localIsOnline && dbIsOnline) {
          // Cas inverse : local offline, DB online. Aligner local sur DB
          // (peut etre la 1ere installation apres un toggle sur un autre tel,
          // ou le user vient de toggler avant le crash). On reste online
          // tant qu'il n'a pas explicitement clique offline.
          setIsOnline(true);
        } else {
          // Etats coherents (les 2 true ou les 2 false) : rien a faire.
        }
      })
      .catch((err) => reportError(err, { tags: { phase: 'layout-online-hydrate' } }));
    return () => { cancelled = true; };
  }, [user?.id, setIsOnline]);

  useDriverGpsTracking({ enabled: geolocEnabled });
  useDriverOnlineTracking({
    isOnline,
    userId: user?.id ?? null,
    geolocEnabled,
    courseState,
  });
  useDriverHeartbeat({ isOnline, userId: user?.id ?? null });
  useNewMissionAlert();
  usePostedMissionAcceptNotifier();
  usePostedMissionUntakenNotifier();
  usePushRegistration();
  // Une seule fois au premier acces au dashboard driver : guide le user vers
  // le reglage "ignorer optimisation batterie" pour eviter que le foreground
  // service de localisation soit tue par les OEM agressifs.
  useBatteryOptimizationOptOut(true);
  return null;
}
