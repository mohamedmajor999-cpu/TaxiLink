// Types partagés pour les API admin et leurs consommateurs front.

export interface PeriodBucket {
  period:   string
  requests: number
  costUsd:  number
}

export interface TopUser {
  userId:   string | null
  name:     string
  requests: number
  costUsd:  number
}

export interface AiUsageTotals {
  requests:     number
  costUsd:      number
  inputTokens:  number
  outputTokens: number
}

export interface AiUsageReport {
  daily:    PeriodBucket[]
  weekly:   PeriodBucket[]
  monthly:  PeriodBucket[]
  topUsers: TopUser[]
  totals:   AiUsageTotals
}

export interface GoogleCostItem {
  id:            number
  period_month:  string
  service:       string
  cost_usd:      number
  request_count: number | null
  notes:         string | null
  updated_at:    string
}

export interface GoogleCostUpsert {
  periodMonth:   string
  service:       string
  costUsd:       number
  requestCount?: number | null
  notes?:        string | null
}

export interface MissionBucket {
  period:         string
  posted:         number
  accepted:       number
  completed:      number
  totalAmount:    number
  acceptanceRate: number
}

export interface MissionTotals {
  posted:         number
  accepted:       number
  completed:      number
  totalAmount:    number
  averageAmount:  number
  acceptanceRate: number
}

export interface MissionStatsReport {
  daily:   MissionBucket[]
  weekly:  MissionBucket[]
  monthly: MissionBucket[]
  totals:  MissionTotals
}

export interface UserCounters {
  totalUsers:     number
  totalDrivers:   number
  totalClients:   number
  newDrivers30d:  number
  newClients30d:  number
  onlineDrivers:  number
  totalLogins90d: number
}

export interface LoginBucket {
  period:      string
  logins:      number
  uniqueUsers: number
}

export interface UserStatsReport {
  counters: UserCounters
  daily:    LoginBucket[]
  weekly:   LoginBucket[]
  monthly:  LoginBucket[]
}

export interface DriverRanking {
  userId:     string
  name:       string
  phone:      string | null
  isOnline:   boolean
  rating:     number
  posted:     number
  accepted:   number
  completed:  number
  caEur:      number
  apiCostUsd: number
}

export interface GroupRanking {
  groupId:        string
  name:           string
  description:    string | null
  members:        number
  missionsTotal:  number
  missions30d:    number
  acceptanceRate: number
  lastMissionAt:  string | null
}

export interface GroupCounters {
  totalGroups:     number
  activeGroups30d: number
  totalMembers:    number
}

export interface OnlineDriver {
  userId:    string
  name:      string
  phone:     string | null
  lat:       number
  lng:       number
  updatedAt: string
}
