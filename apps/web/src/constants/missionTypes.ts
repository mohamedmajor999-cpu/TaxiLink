export const TYPE_COLORS: Record<string, string> = {
  CPAM: 'bg-yellow-100 text-yellow-800',
  PRIVE: 'bg-gray-100 text-gray-800',
  TAXILINK: 'bg-blue-100 text-blue-800',
}

export const TYPE_LABELS: Record<string, string> = {
  CPAM: 'CPAM',
  PRIVE: 'Privé',
  TAXILINK: 'TaxiLink',
  ALL: 'Toutes',
}

export const MISSION_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
  CANCELLED: 'Annulée',
}

export const MISSION_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
}

export const MISSION_TYPES = ['ALL', 'CPAM', 'PRIVE', 'TAXILINK'] as const
export type MissionTypeFilter = typeof MISSION_TYPES[number]
