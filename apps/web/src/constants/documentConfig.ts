import type { Document } from '@/lib/supabase/types'

export type DocType = Document['type']
export type DocStatus = 'valid' | 'pending' | 'invalid'

export const DOC_CONFIG: Record<DocType, { label: string; icon: string; description: string }> = {
  carte_pro: {
    label: 'Carte professionnelle',
    icon: 'badge',
    description: 'Carte T délivrée par la préfecture',
  },
  assurance: {
    label: "Attestation d'assurance",
    icon: 'security',
    description: 'Assurance professionnelle en cours de validité',
  },
  ct: {
    label: 'Contrôle technique',
    icon: 'car_repair',
    description: 'CT valide datant de moins de 2 ans',
  },
  permis: {
    label: 'Permis de conduire',
    icon: 'drive_eta',
    description: 'Permis B en cours de validité',
  },
  carte_grise: {
    label: 'Carte grise',
    icon: 'description',
    description: "Certificat d'immatriculation du véhicule",
  },
}

export const DOC_STATUS_MAP: Record<DocStatus, { label: string; className: string; icon: string }> = {
  valid:   { label: 'Valide',      className: 'bg-green-100 text-green-700',  icon: 'check_circle' },
  pending: { label: 'En attente',  className: 'bg-yellow-100 text-yellow-700', icon: 'schedule' },
  invalid: { label: 'Refusé',      className: 'bg-red-100 text-red-600',      icon: 'cancel' },
}
