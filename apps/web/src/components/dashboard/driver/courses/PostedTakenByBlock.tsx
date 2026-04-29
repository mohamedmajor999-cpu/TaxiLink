'use client'
import { Phone, MessageSquare, MessageCircle } from 'lucide-react'
import { formatDuration } from '@/lib/formatDuration'

interface Props {
  name: string
  phone: string | null
  acceptedAt: string | null
}

export function PostedTakenByBlock({ name, phone, acceptedAt }: Props) {
  const initials = extractInitials(name)
  const ago = acceptedAt ? relativeTime(acceptedAt) : null
  const wa = phone ? toWhatsAppUrl(phone) : null

  return (
    <section className="bg-warm-50 border border-warm-200 rounded-2xl p-3 mb-4">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-9 h-9 rounded-full bg-ink text-paper text-[13px] font-extrabold inline-flex items-center justify-center shrink-0">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-ink leading-tight truncate">{name}</p>
          <p className="text-[11px] text-warm-500 mt-0.5 truncate">
            {ago ?? 'Acceptée'}{phone ? ` · ${phone}` : ''}
          </p>
        </div>
      </div>
      {phone ? (
        <div className="grid grid-cols-3 gap-2">
          <a
            href={`tel:${phone}`}
            className="h-10 rounded-xl bg-ink text-paper inline-flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold active:scale-[0.98] transition-transform"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
            Appeler
          </a>
          <a
            href={`sms:${phone}`}
            className="h-10 rounded-xl bg-paper border border-warm-200 text-ink inline-flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold active:scale-[0.98] transition-transform"
          >
            <MessageSquare className="w-4 h-4" strokeWidth={2} />
            SMS
          </a>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 rounded-xl bg-paper border border-warm-200 text-ink inline-flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold active:scale-[0.98] transition-transform"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2} />
              WhatsApp
            </a>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-warm-500 italic">Numéro de contact indisponible.</p>
      )}
    </section>
  )
}

function extractInitials(full: string): string {
  return full.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return "Accepté à l'instant"
  return `Accepté il y a ${formatDuration(Math.floor(ms / 60_000))}`
}

function toWhatsAppUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const e164 = digits.startsWith('0') ? `33${digits.slice(1)}` : digits
  return `https://wa.me/${e164}`
}
