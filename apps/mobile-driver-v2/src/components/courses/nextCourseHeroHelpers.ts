import type { Mission } from '@taxilink/supabase-types';
import type { ProgressStep } from './StepBar';

export const STATUS_LABEL: Record<ProgressStep, string> = {
  available: 'Prochaine course',
  accepted: 'Prochaine course',
  enroute: 'En route vers le patient',
  onboard: 'Patient à bord',
  dropped: 'Patient déposé',
  done: 'Course terminée',
};

export const CTA_LABEL: Record<ProgressStep, string> = {
  available: 'Accepter la course',
  accepted: 'Je pars chercher le patient',
  enroute: "J'y suis arrivé — patient à bord",
  onboard: 'Patient déposé',
  dropped: 'Course terminée',
  done: 'Course terminée',
};

// Réplique apps/web/src/lib/missionProgress.ts getMissionProgress.
export function getMissionProgress(m: Mission): ProgressStep {
  if (m.status === 'AVAILABLE') return 'available';
  if (m.status === 'DONE') return 'done';
  if (m.dropoff_at) return 'dropped';
  if (m.pickup_at) return 'onboard';
  if (m.enroute_at) return 'enroute';
  return 'accepted';
}

export function shortPlace(address: string): string {
  const first = address.split(',')[0]?.trim();
  return first || address;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH === 0 ? `${d}j` : `${d}j ${remH}h`;
}
