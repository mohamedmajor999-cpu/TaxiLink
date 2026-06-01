import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as Battery from 'expo-battery';
import * as IntentLauncher from 'expo-intent-launcher';

// Sur Android, le foregroundService de localisation est tue par les couches
// "battery optimization" agressives des OEM (Pixel "Adaptive Battery",
// Samsung "Sleeping apps", Xiaomi MIUI, OnePlus). Resultat : la task background
// arrete d'envoyer la position et le chauffeur disparait de l'admin sans
// raison apparente — symptome : "quand le tel est en veille mon pin disparait
// cote admin", rapporte 2026-05-25.
//
// Refonte 2026-05-25 : au lieu d'un one-shot prompt qu'on ne represente jamais,
// on VERIFIE l'etat reel a chaque session via Battery.isBatteryOptimizationEnabledAsync().
// Si l'optimisation est encore active (= le tel peut tuer le foregroundService),
// on reprompt avec un Alert qui ouvre DIRECTEMENT la liste des apps a exempter
// (et non plus le menu general).
//
// Une seule fois par session pour ne pas spammer le user toutes les minutes.
export function useBatteryOptimizationOptOut(enabled: boolean) {
  const promptedThisSessionRef = useRef(false);

  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') return;
    if (promptedThisSessionRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        // Battery.isBatteryOptimizationEnabledAsync : retourne true si le tel
        // applique l'optimisation batterie sur l'app (= peut tuer le foreground
        // service). Si false, le user a deja opt-out, on ne fait rien.
        const stillOptimized = await Battery.isBatteryOptimizationEnabledAsync().catch(() => true);
        if (cancelled) return;
        if (!stillOptimized) {
          // User a deja accorde l'exception, on n'embête plus.
          promptedThisSessionRef.current = true;
          return;
        }

        promptedThisSessionRef.current = true;
        Alert.alert(
          'Rester en ligne en arrière-plan',
          'Pour que le dispatcher voie ta position quand le téléphone est en veille, désactive l\'optimisation batterie pour TaxiLink.\n\nSans ça, Android coupe le suivi GPS dès que tu verrouilles l\'écran.',
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Ouvrir les réglages',
              onPress: () => {
                // IGNORE_BATTERY_OPTIMIZATION_SETTINGS ouvre la LISTE complete
                // (le user voit toutes les apps et doit chercher TaxiLink).
                // Plus user-friendly que REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
                // (qui exige une permission speciale au manifest non
                // recommendee par Google Play).
                IntentLauncher.startActivityAsync(
                  'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
                ).catch(() => {});
              },
            },
          ],
        );
      } catch {
        // expo-battery indispo : on n'insiste pas.
      }
    })();

    return () => { cancelled = true; };
  }, [enabled]);
}
