'use client'

import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { StatsPeriodGrid } from './StatsPeriodGrid'
import { StatsTypeBreakdown } from './StatsTypeBreakdown'
import { StatsRecentList } from './StatsRecentList'
import { useDriverStats } from './useDriverStats'

export function DriverStats() {
  const { missions, loading, error, periods, byType, loadStats } = useDriverStats()

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-black text-secondary mb-1">Statistiques</h2>
        <p className="text-muted text-sm">Votre performance en un coup d&apos;œil</p>
      </div>
      {error && <ErrorBanner message={error} onRetry={loadStats} />}
      {loading ? (
        <SkeletonLoader count={3} height="h-36" />
      ) : (
        <>
          <StatsPeriodGrid periods={periods} />
          <StatsTypeBreakdown byType={byType} total={missions.length} />
          <StatsRecentList missions={missions} />
        </>
      )}
    </div>
  )
}
