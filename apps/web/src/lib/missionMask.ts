import type { Mission } from '@/lib/supabase/types'

// Floutage des donnees patient avant acceptation (Article 9 RGPD).
//
// Tant qu'un chauffeur n'a pas accepte la course, il voit une version masquee :
// - patient_name : initiales (J.D.) au lieu du nom complet
// - phone : masque
// - notes : masque (elles peuvent contenir des infos cliniques)
//
// Le motif medical generique (HDJ/CONSULTATION) reste affiche : c'est une
// categorie de service taxi conventionne, pas un diagnostic specifique.
//
// Trois roles voient les donnees completes :
// - shared_by : l'auteur de la mission (chauffeur qui partage ou client qui
//   reserve)
// - driver_id : le chauffeur qui a accepte
// - client_id : le client lui-meme (pour les courses reservees par client)
//
// Tous les autres voient la version masquee, meme s'ils ont l'URL directe.

export function canSeeFullMission(mission: Mission, viewerId: string | null): boolean {
  if (!viewerId) return false
  return (
    mission.shared_by === viewerId ||
    mission.driver_id === viewerId ||
    mission.client_id === viewerId
  )
}

export function maskMissionForViewer(mission: Mission, viewerId: string | null): Mission {
  if (canSeeFullMission(mission, viewerId)) return mission
  return {
    ...mission,
    patient_name: maskName(mission.patient_name),
    phone: null,
    notes: null,
  }
}

export function maskName(fullName: string | null): string | null {
  if (!fullName) return null
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + '.')
    .join(' ')
  return initials || null
}
