import { useEffect, useState } from 'react';
import { userPrefsService } from '@taxilink/services';
import { DEFAULT_GPS_PREFERENCE, type GpsPreference } from '@taxilink/core';

import { useTheme } from '@/lib/theme';
import type { ThemePref } from './ThemeModeRow';

export function useProfileSectionApp() {
  const theme = useTheme();
  const [popupNewMission, setPopupState] = useState(true);
  const [geolocPushEnabled, setGeolocState] = useState(true);
  const [gpsPref, setGpsPrefState] = useState<GpsPreference>(DEFAULT_GPS_PREFERENCE);
  const [error, setError] = useState<string | null>(null);

  // Charge les préférences au montage. Toutes les sources tolèrent l'échec
  // (fallback aux valeurs par défaut affichées). Le theme est géré par
  // ThemeProvider (cf. src/lib/theme.tsx) — pas re-chargé ici.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      userPrefsService.getNotificationPrefs().catch(() => null),
      userPrefsService.getGpsPref().catch(() => DEFAULT_GPS_PREFERENCE),
    ]).then(([prefs, gps]) => {
      if (cancelled) return;
      if (prefs) {
        setPopupState(prefs.popupNewMission ?? true);
        setGeolocState(prefs.geolocPushEnabled ?? true);
      }
      setGpsPrefState(gps);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persistance des notification prefs : on lit l'état serveur courant pour ne
  // pas écraser une autre clé (mêmes risques que le userPrefsStore web).
  async function persistNotif(patch: { popupNewMission?: boolean; geolocPushEnabled?: boolean }) {
    const current = (await userPrefsService.getNotificationPrefs()) ?? {};
    await userPrefsService.updateNotificationPrefs({ ...current, ...patch });
  }

  async function setPopupNewMission(v: boolean) {
    const previous = popupNewMission;
    setPopupState(v);
    try {
      await persistNotif({ popupNewMission: v });
    } catch (err) {
      setPopupState(previous);
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    }
  }

  async function setGeolocPushEnabled(v: boolean) {
    const previous = geolocPushEnabled;
    setGeolocState(v);
    try {
      await persistNotif({ geolocPushEnabled: v });
    } catch (err) {
      setGeolocState(previous);
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    }
  }

  async function setGpsPref(p: GpsPreference) {
    const previous = gpsPref;
    setGpsPrefState(p);
    try {
      await userPrefsService.updateGpsPref(p);
    } catch (err) {
      setGpsPrefState(previous);
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde GPS');
    }
  }

  // Le theme est branche sur le ThemeContext : changer la pref applique
  // immediatement la palette dark/light dans toute l'app (cf. useTheme).
  const themePref: ThemePref = theme.mode === 'dark' ? 'on' : 'off';
  function setThemePref(p: ThemePref) {
    theme.setMode(p === 'on' ? 'dark' : 'light');
  }

  return {
    popupNewMission,
    setPopupNewMission,
    geolocPushEnabled,
    setGeolocPushEnabled,
    gpsPref,
    setGpsPref,
    themePref,
    setThemePref,
    error,
  };
}
