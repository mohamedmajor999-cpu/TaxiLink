import { api } from '@/lib/api'
import type {
  AiUsageReport,
  MissionStatsReport,
  UserStatsReport,
  DriverRanking,
  GroupRanking,
  GroupCounters,
  OnlineDriver,
  GoogleCostItem,
  GoogleCostUpsert,
} from './adminAnalyticsTypes'

export * from './adminAnalyticsTypes'

export const adminAnalyticsService = {
  getAiUsage(): Promise<AiUsageReport> {
    return api.get<AiUsageReport>('/api/admin/ai-usage')
  },
  getMissionStats(): Promise<MissionStatsReport> {
    return api.get<MissionStatsReport>('/api/admin/missions-stats')
  },
  getUserStats(): Promise<UserStatsReport> {
    return api.get<UserStatsReport>('/api/admin/users-stats')
  },
  getTopDrivers(): Promise<{ items: DriverRanking[] }> {
    return api.get<{ items: DriverRanking[] }>('/api/admin/top-drivers')
  },
  getTopGroups(): Promise<{ items: GroupRanking[]; counters: GroupCounters }> {
    return api.get<{ items: GroupRanking[]; counters: GroupCounters }>('/api/admin/top-groups')
  },
  getOnlineDrivers(): Promise<{ items: OnlineDriver[] }> {
    return api.get<{ items: OnlineDriver[] }>('/api/admin/online-drivers')
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
