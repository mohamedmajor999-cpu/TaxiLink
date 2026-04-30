'use client'

import { useBreakdownSection } from './useBreakdownSection'
import { SectionShell } from './ui/SectionShell'
import { HBar } from './ui/HBar'
import { Skeleton } from './ui/Skeleton'
import { Icon } from '@/components/ui/Icon'
import type { BreakdownRow } from '@/services/adminAnalyticsService'

export function BreakdownSection() {
  const { data, loading, error } = useBreakdownSection()

  return (
    <SectionShell
      title="Répartition courses"
      subtitle="Top types, motifs CPAM et départements (12 derniers mois)"
      iconName="bar_chart"
    >
      {loading && (
        <div className="grid gap-6 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <SkeletonBlock key={i} />)}
        </div>
      )}
      {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {data && (
        <div className="grid gap-6 lg:grid-cols-3">
          <RankList title="Par type"         rows={data.byType}        iconName="category" />
          <RankList title="Top motifs CPAM"  rows={data.byMotif}       iconName="medical_services" />
          <RankList title="Top départements" rows={data.byDepartement} iconName="place" />
        </div>
      )}
    </SectionShell>
  )
}

function RankList({ title, rows, iconName }: { title: string; rows: BreakdownRow[]; iconName: string }) {
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <div className="rounded-2xl border border-line/60 bg-white">
      <div className="flex items-center gap-2 border-b border-line/60 px-4 py-3">
        <Icon name={iconName} size={16} className="text-muted" />
        <h3 className="text-sm font-semibold text-secondary">{title}</h3>
        <span className="ml-auto text-xs text-muted">{rows.length} entrée{rows.length > 1 ? 's' : ''}</span>
      </div>
      <div className="p-4">
        {rows.length === 0 && <p className="text-sm text-muted">Aucune donnée</p>}
        {rows.length > 0 && (
          <ul className="space-y-2.5">
            {rows.map((r, i) => (
              <li key={r.key}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="size-5 shrink-0 rounded-full bg-bgsoft text-center font-semibold text-secondary leading-5">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium text-secondary">{r.key}</span>
                  </div>
                  <span className="shrink-0 font-semibold text-secondary">{r.count}</span>
                </div>
                <HBar value={r.count} max={max} color="bg-secondary" />
                <div className="mt-1 flex justify-between text-[10px] text-muted">
                  <span>{r.acceptedPct}% acceptées</span>
                  <span>{r.caEur.toFixed(0)}€</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SkeletonBlock() {
  return (
    <div className="rounded-2xl border border-line/60 bg-white p-4">
      <Skeleton className="mb-4 h-4 w-32 rounded animate-pulse bg-bgsoft" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-full rounded animate-pulse bg-bgsoft" />)}
      </div>
    </div>
  )
}
