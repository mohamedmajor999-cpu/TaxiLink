import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import { pushTokenService } from '@taxilink/services';

import { useAuth } from './useAuth';

// Expo Go (SDK 53+) n'embarque plus le module natif push remote. Toute tentative
// d'enregistrer un token ou de poser un listener émet un console.error global.
// On detecte le runtime Go et on no-op : le build EAS dev/prod aura tout.
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Channels Android obligatoires pour pousser une notif (heads-up + son) sur
// Android 8+. Sans channel, la notif arrive silencieuse en mode discret.
// Chaque type de notif a son channel pour que le user puisse desactiver
// finement (Settings > Notifications > TaxiLink).
async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  // Channel 1 : nouvelle course visible dans le pool (broadcast departement).
  await Notifications.setNotificationChannelAsync('new-mission', {
    name: 'Nouvelles courses',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFD23F',
    enableVibrate: true,
    showBadge: true,
  });
  // Channel 2 : ton annonce postee a ete acceptee par un autre chauffeur.
  // Importance HIGH = heads-up. Moins urgent qu'une offre directe mais on
  // veut quand meme reveiller le user qui attendait une reponse.
  await Notifications.setNotificationChannelAsync('mission-accepted', {
    name: 'Annonce acceptee',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 200, 150, 200],
    lightColor: '#16a34a',
    enableVibrate: true,
    showBadge: true,
  });
  // Channel 3 : OFFRE EXCLUSIVE — le serveur t'a choisi TOI dans un palier
  // du dispatch. Importance MAX = bypass DND si le user l'a autorise, vibration
  // longue alarm-like. Le user a ~20s pour reagir, faut qu'il entende.
  await Notifications.setNotificationChannelAsync('direct-offer', {
    name: 'Offre exclusive',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 400, 150, 400, 150, 400],
    lightColor: '#dc2626',
    enableVibrate: true,
    showBadge: true,
    bypassDnd: false,
  });
}

// Comportement quand une notif arrive app foreground : on AFFICHE quand meme la
// banniere (sinon le chauffeur app ouverte ne verrait rien arriver).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (IS_EXPO_GO) {
    // Push remote indispo en Expo Go (SDK 53+). On skip, sinon expo-notifications
    // emet un console.error au moindre listener pose.
    return null;
  }
  if (!Device.isDevice) {
    // Emulateur / simulateur : Expo refuse d'emettre un token. Pas une erreur,
    // juste un no-op pour le dev local.
    return null;
  }
  await ensureAndroidChannels();
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  const tokenResp = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return tokenResp.data;
}

/**
 * Enregistre l'appareil aupres d'Expo Push Service au boot driver, persist
 * le token dans Supabase (table push_tokens) et branche un listener qui
 * navigue vers la mission quand l'utilisateur tape la notif.
 *
 * App fermee ? La notif arrive quand meme : Expo Push Service route vers
 * FCM (Android) / APNs (iOS) qui reveillent l'OS — comme WhatsApp.
 */
export function usePushRegistration() {
  const { user } = useAuth();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    registerForPushNotificationsAsync()
      .then(async (token) => {
        if (cancelled || !token) return;
        tokenRef.current = token;
        await pushTokenService
          .upsert({
            token,
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
            deviceName: Device.deviceName ?? null,
          })
          .catch((err) => console.warn('[usePushRegistration] upsert failed', err));
      })
      .catch((err) => console.warn('[usePushRegistration] register failed', err));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (IS_EXPO_GO) return;
    // Tap sur la notif (app background ou killed -> ouverte par tap). Le data
    // payload contient mission_id, on navigue vers la fiche course.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { mission_id?: string };
      if (data?.mission_id) router.push(`/mission/${data.mission_id}`);
    });
    return () => sub.remove();
  }, []);
}
