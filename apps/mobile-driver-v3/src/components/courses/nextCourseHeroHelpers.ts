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

// formatDuration vit désormais dans le module partagé (audit M-06, format canonique
// unique). NB : l'ancienne version locale zero-paddait les minutes (`1h05`) ; le
// canonique unifie sur `1h 5` (cohérence avec l'écran détail testé).
export { formatDuration } from '@/lib/format';
