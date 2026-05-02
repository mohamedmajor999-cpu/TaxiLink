'use client'
import type { GroupActivityEvent } from '@/services/groupActivityService'
import type { GroupDailyActivity } from '@/services/groupStatsService'
import { timeAgoFr } from '@/lib/timeAgo'

interface Props {
  total:  number
  daily:  GroupDailyActivity[]
  events: GroupActivityEvent[]
}

// Activité 7 derniers jours : compteur + mini-barres + feed des derniers
// événements. Le feed donne une "vie" au groupe — sans lui, les barres
// seules sont trop abstraites pour un chauffeur.
export function GroupActivityFeed({ total, daily, events }: Props) {
  const max = Math.max(1, ...daily.map((d) => d.count))
  const today = new Date().toISOString().slice(0, 10)
  return (
    <section className="rounded-2xl bg-warm-50 border border-warm-100 p-4">
      <div className="flex items-end justify-between gap-3">
        <div className="shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-warm-500">
            Activité · 7 jours
          </p>
          <p className="text-[26px] font-bold text-ink leading-none tabular-nums mt-1">{total}</p>
          <p className="text-[11px] text-warm-500 mt-1">Courses échangées</p>
        </div>
        <div className="flex items-end gap-1.5 h-10">
          {daily.map((d) => {
            const h = Math.round((d.count / max) * 100)
            const isToday = d.date === today
            return (
              <span
                key={d.date}
                aria-label={`${d.count} courses le ${d.date}`}
                className={`w-2.5 rounded-t-md ${isToday ? 'bg-brand' : 'bg-warm-300'}`}
                style={{ height: `${Math.max(8, h)}%` }}
              />
            )
          })}
        </div>
      </div>

      {events.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2.5">
          {events.map((e) => <FeedRow key={e.id} event={e} />)}
        </ul>
      )}
    </section>
  )
}

function FeedRow({ event }: { event: GroupActivityEvent }) {
  const verb = event.kind === 'shared' ? 'a partagé' : 'a accepté'
  const route = event.departure && event.destination
    ? `${event.departure} → ${event.destination}`
    : event.departure || event.destination || 'une course'
  return (
    <li className="flex items-start gap-2.5">
      <span className="w-7 h-7 rounded-full bg-ink text-brand flex items-center justify-center font-bold text-[11px] shrink-0">
        {event.driverLabel.charAt(0).toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] text-warm-700 leading-snug">
          <strong className="text-ink font-semibold">{event.driverLabel}</strong>
          {' '}{verb} <strong className="text-ink font-semibold">{route}</strong>
        </p>
        <p className="text-[11px] text-warm-500 mt-0.5">{timeAgoFr(event.at)}</p>
      </div>
      <span className={`shrink-0 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
        event.kind === 'shared' ? 'bg-brand/30 text-ink' : 'bg-emerald-100 text-emerald-700'
      }`}>
        {event.kind === 'shared' ? 'Postée' : 'Acceptée'}
      </span>
    </li>
  )
}
