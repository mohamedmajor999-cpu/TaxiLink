'use client'
import { Plus, Megaphone } from 'lucide-react'
import { useAdsTab } from './useAdsTab'
import { WeekStrip } from '../WeekStrip'
import { AdCardWaiting } from './AdCardWaiting'
import { AdCardAccepted } from './AdCardAccepted'
import { AdCardDone } from './AdCardDone'

interface Props {
  onPostCourse: () => void
}

export function AdsTab({ onPostCourse }: Props) {
  const a = useAdsTab()

  const onSelectDay = (d: Date) => {
    a.setSelected(d)
    if (typeof window === 'undefined') return
    const el = document.getElementById(`ad-day-${d.toDateString()}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  return (
    <div className="pb-24 md:pb-6">
      <WeekStrip days={a.weekDays} selected={a.selected} onSelect={onSelectDay} />

      <div className="mt-4">
        {a.daysGroups.map((g) => (
          <section key={g.key} id={`ad-day-${g.key}`} className="mb-5 scroll-mt-24">
            <header className="flex items-end justify-between mb-2 px-1">
              <h3 className="text-[13px] font-bold text-ink leading-tight first-letter:uppercase">
                {g.label}
              </h3>
              <span className="text-[11px] font-semibold text-warm-500 tabular-nums">
                {g.ads.length} annonce{g.ads.length > 1 ? 's' : ''}
              </span>
            </header>
            {g.ads.map((ad) => {
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
        ))}
      </div>
    </div>
  )
}
