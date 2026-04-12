'use client'

const TYPE_BAR_COLORS: Record<string, string> = {
  CPAM:     'bg-primary',
  PRIVE:    'bg-secondary',
  TAXILINK: 'bg-accent',
}

type TypeStat = { type: string; count: number; earnings: number }

export function StatsTypeBreakdown({ byType, total }: { byType: TypeStat[]; total: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h3 className="font-bold text-secondary mb-4">Répartition par type</h3>
      <div className="space-y-4">
        {byType.map((t) => {
          const pct = total ? Math.round((t.count / total) * 100) : 0
          return (
            <div key={t.type}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-secondary">{t.type}</span>
                <span className="text-sm font-bold text-secondary">
                  {t.count} courses — {t.earnings.toFixed(0)}€
                </span>
              </div>
              <div className="h-2 bg-bgsoft rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${TYPE_BAR_COLORS[t.type]}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
