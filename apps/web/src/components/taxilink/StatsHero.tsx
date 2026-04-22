interface WeekBar {
  label: string
  value: number
}

interface SecondaryStat {
  label: string
  value: string
}

interface Props {
  title: string
  amountEur: number
  deltaPercent?: number
  weeks: WeekBar[]
  stats: SecondaryStat[]
}

export function StatsHero({ title, amountEur, deltaPercent, weeks, stats }: Props) {
  const max = Math.max(...weeks.map((w) => w.value), 1)

  return (
    <section className="bg-ink text-paper rounded-2xl p-6">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-paper/60">
          {title}
        </p>
        {deltaPercent !== undefined && (
          <span
            className={`text-xs font-semibold ${deltaPercent >= 0 ? 'text-brand' : 'text-danger-soft'}`}
          >
            {deltaPercent >= 0 ? '↑' : '↓'} {Math.abs(deltaPercent)}%
          </span>
        )}
      </div>

      <div className="font-serif text-display-md text-paper mb-6">
        {amountEur.toLocaleString('fr-FR')}
        <span className="text-lg font-sans align-top text-paper/60 ml-1">€</span>
      </div>

      <div className="flex items-end gap-3 h-24 mb-2">
        {weeks.map((w, i) => {
          const isLast = i === weeks.length - 1
          const heightPct = (w.value / max) * 100
          return (
            <div key={w.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t ${isLast ? 'bg-brand' : 'bg-paper/15'}`}
                  style={{ height: `${heightPct}%` }}
                  aria-label={`${w.label}: ${w.value}`}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-end gap-3 mb-6">
        {weeks.map((w) => (
          <div key={`l-${w.label}`} className="flex-1 text-center text-[11px] text-paper/50">
            {w.label}
          </div>
        ))}
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-4 gap-2 border-t border-paper/10 pt-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-semibold text-base text-paper">{s.value}</div>
              <div className="text-[11px] text-paper/50 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
