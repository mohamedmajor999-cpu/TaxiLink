import { useEffect, useState } from 'react';
import { userPrefsService } from '@taxilink/services';
import { DEFAULT_GPS_PREFERENCE, type GpsPreference } from '@taxilink/core';

// Charge et expose la preference d'application GPS du chauffeur
// (auth.users.raw_user_meta_data.gps_pref). Tolerant : retombe sur le defaut
// si l'appel echoue (offline, session expiree…).
export function useGpsPref(): GpsPreference {
  const [pref, setPref] = useState<GpsPreference>(DEFAULT_GPS_PREFERENCE);

  useEffect(() => {
    let cancelled = false;
    userPrefsService
      .getGpsPref()
      .then((p) => {
        if (!cancelled) setPref(p);
      })
      .catch(() => {
        // garde le defaut
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return pref;
}
