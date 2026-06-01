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
//   - lowest   : cell-tower only (~1-3km), conso quasi nulle
//   - low      : WiFi+cellular only (~500m), ~30% conso d'une radio GPS active
//   - balanced : GPS+WiFi balance (~100m), conso moyenne
//   - high     : GPS pleine puissance (~10m), conso elevee
export type TrackingAccuracy = 'lowest' | 'low' | 'balanced' | 'high';

export interface TrackingProfile {
  intervalMs: number;
  distanceM:  number;
  accuracy:   TrackingAccuracy;
  // Android only : si > 0, l'OS batch plusieurs reads avant de reveiller le
  // process JS. Gain enorme sur le drain (le radio reste off plus longtemps).
  deferredMs: number;
  deferredM:  number;
}

interface ProfileInput {
  courseState:  CourseState;
  // Niveau de batterie 0..1, ou -1 si inconnu.
  batteryLevel: number;
  // True si l'accelerometre detecte du mouvement, false si stationary 60s+.
  // Si null (capteur indispo) : considere comme moving par defaut.
  isMoving: boolean | null;
  // True si l'app est en background. Permet de relacher la fraicheur GPS
  // pendant que le chauffeur n'a pas l'ecran sous les yeux.
  appBackgrounded: boolean;
}

// Fonction PURE — testable sans device et sans React.
//
// Refonte 2026-05-25 : profil UNIQUE 10s + accuracy 'high' (~10m). Peu importe
// l'etat (idle/assigned/in_progress, stationary/moving, foreground/background) :
// tant que le chauffeur est en ligne, on envoie un fix toutes les 10 secondes
// avec une precision cible de 10m. Demande user.
//
// Garde-fou batterie : sous 20% hors course, on rallonge a 30s et on descend
// a 'balanced' (~100m) — eviter de tuer le tel en fin de journee. En course
// active la precision et la fraicheur priment (chauffeur branche au chargeur).
//
// distanceM=0 : pas de filtre distance, on garantit un signal toutes les 10s
// MEME a l'arret. Indispensable pour que l'admin sache si le chauffeur est
// vraiment la (a l'arret) ou s'il a decroche.
export function profileFor({ courseState, batteryLevel }: ProfileInput): TrackingProfile {
  const onActiveCourse = courseState === 'assigned' || courseState === 'in_progress';

  // Batterie critique hors course : ralentit cadence + degrade precision.
  if (batteryLevel >= 0 && batteryLevel < 0.2 && !onActiveCourse) {
    return {
      intervalMs: 30_000,
      distanceM: 0,
      accuracy: 'balanced',
      deferredMs: 60_000,
      deferredM: 0,
    };
  }

  // Cadence 10s + accuracy 'high' (~10m).
  return {
    intervalMs: 10_000,
    distanceM: 0,
    accuracy: 'high',
    deferredMs: 0,
    deferredM: 0,
  };
}

export function profilesEqual(a: TrackingProfile | null, b: TrackingProfile | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.intervalMs === b.intervalMs
    && a.distanceM === b.distanceM
    && a.accuracy === b.accuracy
    && a.deferredMs === b.deferredMs
    && a.deferredM === b.deferredM;
}

// Texte de la notif persistante du foreground service GPS, selon l'état courant.
// Pure (pas de dépendance native) → testable. La batterie critique prime sur
// l'état de course pour informer le chauffeur du mode éco. Extrait de
// useDriverOnlineTracking (audit L-25).
export function notificationBodyFor(
  courseState: CourseState,
  batteryLevel: number,
  isMoving: boolean | null,
): string {
  if (batteryLevel >= 0 && batteryLevel < 0.2) {
    return 'Position partagée (mode économie batterie).';
  }
  if (courseState === 'assigned') return 'En route vers votre client.';
  if (courseState === 'in_progress') return 'Course en cours.';
  if (isMoving === false) return 'Position partagée (à l\'arrêt, mode éco).';
  return 'Votre position est partagée pour recevoir des courses.';
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
