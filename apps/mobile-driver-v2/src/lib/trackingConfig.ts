import * as SecureStore from 'expo-secure-store';

// État d'un chauffeur vis-à-vis d'une course.
//   - idle           : en ligne, sans course assignée (situation par défaut)
//   - assigned       : course acceptée, en route vers le client
//   - in_progress    : client à bord, course active
//
// Cet état est piloté par React (toggle online/accept/finish) et lu par
// useDriverOnlineTracking pour ajuster l'intervalle de tracking.
export type CourseState = 'idle' | 'assigned' | 'in_progress';

// Niveau d'accuracy demande a expo-location. Map en Location.Accuracy dans
// useDriverOnlineTracking. Type string-only pour garder ce module pur (pas
// d'import Location ici => testable sans mock natif).
//   - low      : WiFi+cellular only (~500m), ~30% conso d'une radio GPS active
//   - balanced : GPS+WiFi balance (~100m), conso moyenne
//   - high     : GPS pleine puissance (~10m), conso elevee
export type TrackingAccuracy = 'low' | 'balanced' | 'high';

export interface TrackingProfile {
  intervalMs: number;
  distanceM:  number;
  accuracy:   TrackingAccuracy;
}

interface ProfileInput {
  courseState:  CourseState;
  // Niveau de batterie 0..1, ou -1 si inconnu.
  batteryLevel: number;
}

// Fonction PURE — testable sans device et sans React.
// Priorité : batterie faible écrase tout. Sinon courseState dicte la finesse.
export function profileFor({ courseState, batteryLevel }: ProfileInput): TrackingProfile {
  if (batteryLevel >= 0 && batteryLevel < 0.2) {
    return { intervalMs: 30_000, distanceM: 20, accuracy: 'low' };
  }
  switch (courseState) {
    case 'assigned':
      // En route vers client : besoin de precision pour l'ETA pickup, mais
      // 3s etait overkill (conso batterie). 8s = compromis Uber-grade qui
      // tient sur une longue course sans cramer la batterie.
      return { intervalMs: 8_000, distanceM: 10, accuracy: 'balanced' };
    case 'in_progress':
      // Client à bord : précision moyenne suffit (le pax sait où il va).
      return { intervalMs: 5_000, distanceM: 10, accuracy: 'balanced' };
    case 'idle':
    default:
      // Online dispo : pas besoin de fix GPS precis, accuracy low (WiFi+cell)
      // suffit pour le tri proximite admin (~500m d'erreur acceptable a
      // l'echelle d'un departement). Gain batterie ~70% vs balanced.
      return { intervalMs: 15_000, distanceM: 10, accuracy: 'low' };
  }
}

export function profilesEqual(a: TrackingProfile | null, b: TrackingProfile | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.intervalMs === b.intervalMs
    && a.distanceM === b.distanceM
    && a.accuracy === b.accuracy;
}

const COURSE_STATE_KEY = 'taxilink.tracking.courseState';

export async function getStoredCourseState(): Promise<CourseState> {
  try {
    const v = await SecureStore.getItemAsync(COURSE_STATE_KEY);
    if (v === 'assigned' || v === 'in_progress' || v === 'idle') return v;
  } catch {
    // SecureStore peut throw en cas de corruption keystore — fallback safe.
  }
  return 'idle';
}

export async function setStoredCourseState(s: CourseState): Promise<void> {
  try {
    await SecureStore.setItemAsync(COURSE_STATE_KEY, s);
  } catch {
    // best-effort
  }
}
