'use client'
import type { GroupMemberStats } from '@taxilink/core'

interface Props {
  members: GroupMemberStats[]
  max?:    number
}

function initial(m: GroupMemberStats): string {
  const src = m.firstName ?? m.fullName ?? m.lastName ?? '?'
  return src.charAt(0).toUpperCase()
}

// Bande d'avatars "qui est en ligne maintenant".
// Cachée si personne n'est en ligne — un cadre "0 en ligne" serait du bruit.
export function GroupOnlineStrip({ members, max = 6 }: Props) {
  const onlines = members.filter((m) => m.isOnline)
  if (onlines.length === 0) return null
  const visible = onlines.slice(0, max)
  const extra = onlines.length - visible.length
  return (
    <section className="mb-3 rounded-2xl border border-warm-200 bg-paper p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-warm-500">
          En ligne maintenant
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
          {onlines.length} actif{onlines.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {visible.map((m) => (
          <span
            key={m.driverId}
            title={m.fullName ?? m.firstName ?? 'Confrère'}
            className="relative w-9 h-9 rounded-full bg-ink text-brand flex items-center justify-center font-bold text-[13px] border-2 border-paper"
          >
            {initial(m)}
            <span aria-hidden className="absolute -inset-[3px] rounded-full border-2 border-emerald-500" />
          </span>
        ))}
        {extra > 0 && (
          <span className="w-9 h-9 rounded-full bg-warm-100 text-warm-700 flex items-center justify-center text-[11px] font-bold border-2 border-paper">
            +{extra}
          </span>
        )}
      </div>
    </section>
  )
}
