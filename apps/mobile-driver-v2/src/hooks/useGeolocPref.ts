import { useEffect, useState } from 'react';
import { userPrefsService } from '@taxilink/services';

// Charge le toggle "Partager ma position en ligne" depuis
// auth.users.raw_user_meta_data.notification_prefs.geolocPushEnabled.
// Defaut = true (l'opt-in par defaut est aligne sur le PWA).
//
// Limite assumee : ce hook ne se re-synchronise pas automatiquement quand
// l'utilisateur change la pref dans Profil > Application. Il faut remount
// le composant consommateur (ex: revenir sur l'onglet Carte) pour relire
// la valeur. C'est suffisant pour V1 — un realtime sur user_metadata
// serait sur-engineering.
export function useGeolocPref(): { enabled: boolean; loaded: boolean } {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    userPrefsService
      .getNotificationPrefs()
      .then((p) => {
        if (cancelled) return;
        setEnabled(p?.geolocPushEnabled ?? true);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoaded(true); // garde true par defaut
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { enabled, loaded };
}
