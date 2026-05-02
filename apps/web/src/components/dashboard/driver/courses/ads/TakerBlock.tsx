'use client'
import { Phone, MessageSquare, MessageCircle } from 'lucide-react'
import type { DriverProfile } from './adsHelpers'

interface Props {
  driver: DriverProfile | null
  subline?: string
}

function initials(name: string | null): string {
  if (!name) return '??'
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Normalise un numéro pour wa.me : digits-only, format français "0XYZ" ramené
 * à "33XYZ". Si déjà international (commence par autre chose), on laisse.
 */
function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '33' + digits.slice(1)
  return digits
}

export function TakerBlock({ driver, subline }: Props) {
  const name = driver?.full_name ?? 'Collègue'
  const phone = driver?.phone
  const tel = phone ? `tel:${phone}` : null
  const sms = phone ? `sms:${phone}` : null
  const wa = phone ? `https://wa.me/${waNumber(phone)}` : null

  return (
    <div className="mt-2.5 flex items-center gap-2.5 p-2.5 rounded-xl bg-paper/70 backdrop-blur-sm">
      <div className="w-9 h-9 rounded-full bg-ink text-brand grid place-items-center text-[11px] font-extrabold shrink-0">
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-ink truncate">{name}</p>
        {subline && <p className="text-[11.5px] text-warm-500 truncate mt-0.5">{subline}</p>}
      </div>
      {phone && (
        <div className="flex gap-1.5">
          {sms && (
            <a
              href={sms}
              aria-label="Envoyer un SMS"
              className="w-9 h-9 rounded-lg bg-paper border border-warm-200 grid place-items-center text-ink hover:bg-warm-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" strokeWidth={2} />
            </a>
          )}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Envoyer un WhatsApp"
              className="w-9 h-9 rounded-lg bg-[#25D366] text-paper grid place-items-center hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2.2} />
            </a>
          )}
          {tel && (
            <a
              href={tel}
              aria-label="Appeler"
              className="w-9 h-9 rounded-lg bg-success text-paper grid place-items-center hover:bg-success/90 transition-colors"
            >
              <Phone className="w-4 h-4" strokeWidth={2.2} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
