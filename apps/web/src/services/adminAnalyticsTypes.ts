// Types partagés pour les API admin (analytics : ai-usage, missions, users, google).
// Les types de classement (drivers ranking, groups, online) sont dans adminRankingTypes.ts.

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

export interface MissionFunnel {
  posted:    number
  viewed:    number
  accepted:  number
  completed: number
}

export interface MissionStatsReport {
  daily:    MissionBucket[]
  weekly:   MissionBucket[]
  monthly:  MissionBucket[]
  totals:   MissionTotals
  funnel:   MissionFunnel
  heatmap:  number[][]
  comparisons: { current: MissionTotals; previous: MissionTotals }
}

export interface BreakdownRow {
  key:         string
  count:       number
  caEur:       number
  acceptedPct: number
}

export interface MissionsBreakdown {
  byType:        BreakdownRow[]
  byMotif:       BreakdownRow[]
  byDepartement: BreakdownRow[]
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
  comparisons: {
    newDrivers: { current: number; previous: number }
    newClients: { current: number; previous: number }
    logins:     { current: number; previous: number }
  }
  daily:   LoginBucket[]
  weekly:  LoginBucket[]
  monthly: LoginBucket[]
}

