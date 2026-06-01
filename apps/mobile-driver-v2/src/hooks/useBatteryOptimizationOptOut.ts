import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IntentLauncher from 'expo-intent-launcher';

const STORAGE_KEY = 'taxilink:battery-opt-asked-v1';

// Sur Android, le foregroundService de localisation est tue par les couches
// "battery optimization" agressives des OEM (Pixel "Adaptive Battery",
// Samsung "Sleeping apps", Xiaomi MIUI, OnePlus). Resultat : la task background
// arrete d'envoyer la position et le chauffeur disparait de l'admin sans
// raison apparente.
//
// On guide le user vers le reglage systeme la 1ere fois qu'il atterrit sur
// le dashboard driver. Une fois "ask", on ne represente plus la popup (la
// liste systeme est toujours accessible depuis Settings).
export function useBatteryOptimizationOptOut(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') return;

    let cancelled = false;
    (async () => {
      try {
        const asked = await AsyncStorage.getItem(STORAGE_KEY);
        if (asked === '1' || cancelled) return;
        await AsyncStorage.setItem(STORAGE_KEY, '1');

        Alert.alert(
          'Rester en ligne en arrière-plan',
          'Android peut mettre TaxiLink en veille profonde et arrêter le suivi GPS.\n\nPour rester visible côté dispatcher, désactive l\'optimisation batterie pour TaxiLink dans les réglages.',
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Ouvrir les réglages',
              onPress: () => {
                IntentLauncher.startActivityAsync(
                  'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
                ).catch(() => {});
              },
            },
          ],
        );
      } catch {
        // AsyncStorage indispo : on n'insiste pas, le user peut toujours
        // aller dans les reglages manuellement.
      }
    })();

    return () => { cancelled = true; };
  }, [enabled]);
}
