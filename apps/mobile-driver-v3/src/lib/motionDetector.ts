import { Accelerometer } from 'expo-sensors';

// Detecteur de mouvement style "Significant Location Changes" (iOS) / "Activity
// Recognition" (Android), mais piloté par l'accelerometre via expo-sensors.
//
// Objectif HyperSense : couper le GPS quand le device ne bouge plus.
// L'accelerometre coute ~50x moins de batterie que le GPS, donc le sampler
// tourner H24 a 1Hz est negligeable (~0.1%/h estime).
//
// Heuristique :
//   - Sample @ 1Hz (updateInterval = 1000ms)
//   - Calcule magnitude = sqrt(x² + y² + z²) - 1 (retire gravite)
//   - Fenetre glissante 60s : si max(|magnitude|) < THRESHOLD => stationary
//   - Resume au mouvement immediatement (1 sample > THRESHOLD)
//
// THRESHOLD = 0.05g : seuil empirique qui ignore le micro-jitter capteur mais
// detecte une voiture qui demarre / un tel qu'on prend en main.

const SAMPLE_RATE_MS = 1000;
const STATIONARY_WINDOW_MS = 60_000;
const MOTION_THRESHOLD_G = 0.05;
const WINDOW_SIZE = STATIONARY_WINDOW_MS / SAMPLE_RATE_MS;

type Listener = (isMoving: boolean) => void;

let subscription: { remove(): void } | null = null;
let listeners: Set<Listener> = new Set();
let buffer: number[] = [];
let lastIsMoving = true;
let started = false;

function notify(isMoving: boolean) {
  if (isMoving === lastIsMoving) return;
  lastIsMoving = isMoving;
  for (const l of listeners) {
    try { l(isMoving); } catch { /* listener safe */ }
  }
}

async function ensureStarted() {
  if (started) return;
  const available = await Accelerometer.isAvailableAsync().catch(() => false);
  if (!available) {
    // Pas d'accelerometre dispo (emulateur sans simulation) => on considere
    // toujours moving pour ne pas couper le GPS a tort.
    lastIsMoving = true;
    return;
  }
  Accelerometer.setUpdateInterval(SAMPLE_RATE_MS);
  subscription = Accelerometer.addListener(({ x, y, z }) => {
    const magnitude = Math.abs(Math.sqrt(x * x + y * y + z * z) - 1);
    buffer.push(magnitude);
    if (buffer.length > WINDOW_SIZE) buffer.shift();

    if (magnitude >= MOTION_THRESHOLD_G) {
      notify(true);
      return;
    }
    if (buffer.length < WINDOW_SIZE) return;
    const maxInWindow = Math.max(...buffer);
    notify(maxInWindow >= MOTION_THRESHOLD_G);
  });
  started = true;
}

function maybeStop() {
  if (listeners.size > 0) return;
  subscription?.remove();
  subscription = null;
  buffer = [];
  started = false;
  lastIsMoving = true;
}

// Subscribe au stream isMoving. Demarre l'accelerometre au 1er abonne,
// l'arrete au dernier desabo. Retourne une fonction de cleanup.
export function subscribeToMotion(listener: Listener): () => void {
  listeners.add(listener);
  // Push immediat de l'etat courant pour que le consommateur ne reste pas en
  // attente du 1er changement.
  listener(lastIsMoving);
  ensureStarted();
  return () => {
    listeners.delete(listener);
    maybeStop();
  };
}

export function getCurrentIsMoving(): boolean {
  return lastIsMoving;
}
