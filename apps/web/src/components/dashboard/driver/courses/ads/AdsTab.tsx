'use client'
import { Plus, Megaphone } from 'lucide-react'
import { useAdsTab } from './useAdsTab'
import { WeekStrip } from '../WeekStrip'
import { AdCardWaiting } from './AdCardWaiting'
import { AdCardAccepted } from './AdCardAccepted'
import { AdCardDone } from './AdCardDone'
import { agendaDayLabel, startOfDay, addDays } from '../agendaHelpers'

interface Props {
  onPostCourse: () => void
}

export function AdsTab({ onPostCourse }: Props) {
  const a = useAdsTab()

  if (a.loading) {
    return (
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-32 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
        ))}
      </ul>
    )
  }
  if (a.error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        {a.error}
      </div>
    )
  }

  if (a.daysGroups.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-warm-50 border border-warm-100 grid place-items-center">
          <Megaphone className="w-6 h-6 text-warm-400" strokeWidth={1.8} />
        </div>
        <h3 className="text-[15px] font-bold text-ink mb-1">Aucune annonce</h3>
        <p className="text-[13px] text-warm-500 leading-relaxed mb-4 max-w-sm mx-auto">
          Une course que tu ne peux pas faire ?<br />Un collègue la prend en 30 secondes.
        </p>
        <button
          type="button"
          onClick={onPostCourse}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-brand text-ink text-[13px] font-extrabold"
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          Nouvelle annonce
        </button>
      </div>
    )
  }

  const selectedKey = a.selected.toDateString()
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const visibleGroup = a.daysGroups.find((g) => g.key === selectedKey)
  const dayLabel = visibleGroup?.label ?? agendaDayLabel(a.selected, today, tomorrow)

  return (
    <div className="pb-24 md:pb-6">
      <WeekStrip days={a.weekDays} selected={a.selected} onSelect={a.setSelected} />

      <div className="mt-4">
        <section className="mb-5">
          <header className="flex items-end justify-between mb-2 px-1">
            <h3 className="text-[13px] font-bold text-ink leading-tight first-letter:uppercase">
              {dayLabel}
            </h3>
            <span className="text-[11px] font-semibold text-warm-500 tabular-nums">
              {visibleGroup ? `${visibleGroup.ads.length} annonce${visibleGroup.ads.length > 1 ? 's' : ''}` : '0 annonce'}
            </span>
          </header>

          {!visibleGroup && (
            <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/50 py-8 text-center text-[13px] text-warm-500">
              Aucune annonce ce jour-là
            </div>
          )}

          {visibleGroup?.ads.map((ad) => {
            if (ad.state === 'waiting') {
              return <AdCardWaiting key={ad.mission.id} mission={ad.mission} />
            }
            if (ad.state === 'accepted') {
              return (
                <AdCardAccepted
                  key={ad.mission.id}
                  mission={ad.mission}
                  driver={ad.driver}
                  now={a.nowTick}
                />
              )
            }
            return <AdCardDone key={ad.mission.id} mission={ad.mission} driver={ad.driver} />
          })}
        </section>
      </div>
    </div>
  )
}
