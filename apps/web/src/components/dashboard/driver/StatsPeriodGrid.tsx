'use client'

type Period = { label: string; rides: number; km: number; earnings: number }

export function StatsPeriodGrid({ periods }: { periods: Period[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {periods.map((s) => (
        <div key={s.label} className="bg-white rounded-2xl shadow-soft p-6">
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">{s.label}</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-black text-secondary">{s.rides}</div>
              <div className="text-[10px] text-muted uppercase">courses</div>
            </div>
            <div>
              <div className="text-2xl font-black text-secondary">{s.km.toFixed(0)}</div>
              <div className="text-[10px] text-muted uppercase">km</div>
            </div>
            <div>
              <div className="text-2xl font-black text-primary">{s.earnings.toFixed(0)}€</div>
              <div className="text-[10px] text-muted uppercase">gains</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
