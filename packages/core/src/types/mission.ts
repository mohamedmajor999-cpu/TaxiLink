export type MissionType = 'CPAM' | 'PRIVE' | 'TAXILINK'
export type MissionStatus = 'AVAILABLE' | 'ACCEPTED' | 'IN_PROGRESS' | 'DONE'

export interface Mission {
  id: string
  type: MissionType
  status: MissionStatus
  departure: string
  destination: string
  distanceKm: number
  priceEur: number
  /** Borne basse de la tranche de prix (privé uniquement). Absent si prix fixe. */
  priceMinEur?: number
  /** Borne haute de la tranche de prix (privé uniquement). Absent si prix fixe. */
  priceMaxEur?: number
  scheduledAt: string // ISO string
  patientName?: string
  phone?: string
  driverId?: string
  createdAt: string
}
