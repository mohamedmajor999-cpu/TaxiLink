import type { Mission } from '@taxilink/supabase-types';

// Helpers PURS de l'ecran detail course. Extraits dans un fichier sans
// dependances React/RN pour rester testables via Vitest (Node) sans avoir a
// stuber react-native. Reuse de la logique RGPD du web (apps/web/src/lib/
// missionMask.ts) — toute divergence ici est un bug.

// === Masquage RGPD Article 9 ===
// Tant que la course n'est pas acceptee, ou que le viewer n'est ni l'auteur ni
// l'accepteur ni le client, on masque : nom (initiales), telephone (null), notes (null).
export function canSeeFullMission(mission: Mission, viewerId: string | null): boolean {
  if (!viewerId) return false;
  if (mission.status === 'AVAILABLE') return false;
  return (
    mission.shared_by === viewerId ||
    mission.driver_id === viewerId ||
    mission.client_id === viewerId
  );
}

export function maskName(fullName: string | null): string | null {
  if (!fullName) return null;
  return (
    fullName.trim().split(/\s+/).filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + '.')
      .join(' ') || null
  );
}

// formatDuration vit désormais dans le module partagé (audit M-06, format canonique
// unique). Ré-exporté ici pour préserver les imports existants (test + missionDetailParts).
export { formatDuration } from '@/lib/format';
