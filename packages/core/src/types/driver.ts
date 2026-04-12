export interface Driver {
  id: string
  name: string
  email: string
  phone?: string
  vehicle?: string
  vehicleType?: string
  cpamEnabled: boolean
  rating: number
  totalRides: number
  isOnline: boolean
  avatarUrl?: string
  todayEarnings?: number
  todayRides?: number
  todayKm?: number
  createdAt: string
}
