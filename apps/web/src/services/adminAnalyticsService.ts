import { api } from '@/lib/api'

export interface PeriodBucket {
  period:   string
  requests: number
  costUsd:  number
}

export interface TopUser {
  userId:    string | null
  name:      string
  requests:  number
  costUsd:   number
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

export const adminAnalyticsService = {
  getAiUsage(): Promise<AiUsageReport> {
    return api.get<AiUsageReport>('/api/admin/ai-usage')
  },
  listGoogleCosts(): Promise<{ items: GoogleCostItem[] }> {
    return api.get<{ items: GoogleCostItem[] }>('/api/admin/google-costs')
  },
  upsertGoogleCost(input: GoogleCostUpsert): Promise<{ item: GoogleCostItem }> {
    return api.post<{ item: GoogleCostItem }>('/api/admin/google-costs', input)
  },
  deleteGoogleCost(id: number): Promise<{ ok: true }> {
    return api.delete<{ ok: true }>(`/api/admin/google-costs?id=${id}`)
  },
}
