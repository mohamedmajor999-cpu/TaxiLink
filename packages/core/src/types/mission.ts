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
  scheduledAt: string // ISO string
  patientName?: string
  phone?: string
  driverId?: string
  createdAt: string
}
