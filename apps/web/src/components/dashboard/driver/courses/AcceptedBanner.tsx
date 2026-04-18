'use client'
import { Phone, User } from 'lucide-react'

export function AcceptedBanner({
  profile,
  acceptedAt,
}: {
  profile?: { full_name: string | null; phone: string | null }
  acceptedAt: string | null
}) {
  const name = profile?.full_name?.trim() || 'Chauffeur confirmé'
  const phone = profile?.phone?.trim() || null
  return (
    <div className="mx-5 mt-3 rounded-xl bg-warm-50 border border-warm-200 px-3 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center shrink-0">
          <User className="w-4 h-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink truncate">{name}</div>
          {acceptedAt && (
            <div className="text-[11px] text-warm-500">Accepté {relativeTime(acceptedAt)}</div>
          )}
        </div>
      </div>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-ink text-paper text-[12px] font-semibold hover:bg-warm-800 transition-colors shrink-0"
        >
          <Phone className="w-3 h-3" strokeWidth={2.2} />
          Appeler
        </a>
      )}
    </div>
  )
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return `il y a ${d} j`
}
