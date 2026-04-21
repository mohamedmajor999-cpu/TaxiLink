export interface AgendaRide {
  id: string
  type: 'CPAM' | 'PRIVE' | 'TAXILINK'
  patientName: string
  phone?: string
  departure: string
  destination: string
  distanceKm: number
  priceEur: number
  priceMinEur?: number
  priceMaxEur?: number
  scheduledAt: string // ISO string
  driverId: string
}

export interface DayStats {
  rides: number
  km: number
  earnings: number
}

export interface WeekStats {
  rides: number
  km: number
  earnings: number
  days: Record<string, DayStats>
}
