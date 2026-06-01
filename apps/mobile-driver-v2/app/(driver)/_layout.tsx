import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { IncomingMissionAlertModal } from '@/components/missions/IncomingMissionAlertModal';
import { IncomingMissionOfferModal } from '@/components/missions/IncomingMissionOfferModal';
import { InAppNotificationBanner } from '@/components/notifications/InAppNotificationBanner';
import { MissionRealtimeProvider } from '@/components/realtime/MissionRealtimeProvider';
import { useBatteryOptimizationOptOut } from '@/hooks/useBatteryOptimizationOptOut';
import { useDriverGpsTracking } from '@/hooks/useDriverGpsTracking';
import { useGeolocPref } from '@/hooks/useGeolocPref';
import { useNewMissionAlert } from '@/hooks/useNewMissionAlert';
import { usePostedMissionAcceptNotifier } from '@/hooks/usePostedMissionAcceptNotifier';
import { usePostedMissionUntakenNotifier } from '@/hooks/usePostedMissionUntakenNotifier';
import { usePushRegistration } from '@/hooks/usePushRegistration';

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
    </MissionRealtimeProvider>
  );
}

// Pont sans rendu : monte les hooks globaux de la session driver (notifs +
// GPS tracking). Place sous MissionRealtimeProvider pour que
// usePostedMissionAcceptNotifier puisse lire le contexte realtime.
//
// useDriverGpsTracking est hisse ici (et non dans chaque ecran qui
// consomme la position) pour garantir une SEULE souscription GPS pour
// toute la session : le tri proximite, la carte et le push DB lisent
// tous useGpsStore. Pas de re-fix GPS quand on navigue entre ecrans.
function DriverNotifiersBridge() {
  const { enabled: geolocEnabled } = useGeolocPref();
  useDriverGpsTracking({ enabled: geolocEnabled });
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
