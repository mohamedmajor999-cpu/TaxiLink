'use client'
import { Phone, MessageSquare, MessageCircle } from 'lucide-react'
import { waNumber } from '@/lib/phone'
import type { GroupMemberStats } from '@taxilink/core'

interface Props { member: GroupMemberStats }

export function GroupMemberRow({ member }: Props) {
  const name =
    member.lastName && member.firstName
      ? `${member.lastName} ${member.firstName.charAt(0).toUpperCase()}.`
      : member.fullName || member.lastName || member.firstName || 'Chauffeur'
  const info =
    member.role === 'admin'
      ? `${member.sharedCount + member.acceptedCount} activité${(member.sharedCount + member.acceptedCount) > 1 ? 's' : ''}`
      : member.isOnline
        ? 'En ligne'
        : 'Hors ligne'
  const initial = (name.charAt(0) || '?').toUpperCase()
  const phone = member.phone

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-paper border border-warm-200">
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center">
          <span className="text-brand text-[14px] font-bold">{initial}</span>
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-paper ${
            member.isOnline ? 'bg-emerald-500' : 'bg-warm-300'
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-ink truncate">{name}</p>
        <p className="text-[12px] text-warm-500 mt-0.5 truncate">{info}</p>
      </div>
      {member.role === 'admin' && (
        <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-brand text-ink text-[10px] font-bold uppercase tracking-wider">
          Admin
        </span>
      )}
      {phone && (
        <div className="flex gap-1.5 shrink-0">
          <a
            href={`sms:${phone}`}
            aria-label={`Envoyer un SMS à ${name}`}
            className="w-9 h-9 rounded-lg bg-paper border border-warm-200 grid place-items-center text-ink hover:bg-warm-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" strokeWidth={2} />
          </a>
          <a
            href={`https://wa.me/${waNumber(phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Envoyer un WhatsApp à ${name}`}
            className="w-9 h-9 rounded-lg bg-[#25D366] text-paper grid place-items-center hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-4 h-4" strokeWidth={2.2} />
          </a>
          <a
            href={`tel:${phone}`}
            aria-label={`Appeler ${name}`}
            className="w-9 h-9 rounded-lg bg-success text-paper grid place-items-center hover:bg-success/90 transition-colors"
          >
            <Phone className="w-4 h-4" strokeWidth={2.2} />
          </a>
        </div>
      )}
    </div>
  )
}
