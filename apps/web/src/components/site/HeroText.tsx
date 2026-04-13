import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

const TRUST_BADGES = [
  { icon: 'check_circle', label: '100% gratuit'         },
  { icon: 'notifications', label: 'Notification instantanée' },
  { icon: 'calendar_month', label: 'Agenda automatique'  },
]

export function HeroText() {
  return (
    <div>
      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
        <div className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
        <span className="text-white/80 text-xs font-semibold">Réservé aux professionnels du taxi · 100% gratuit</span>
      </div>

      <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
        Fini WhatsApp.<br />
        <span className="text-primary">Échangez vos courses</span><br />
        entre collègues.
      </h1>

      <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-md">
        Postez une course hôpital ou privée en 10 secondes. Un collègue la récupère,
        vous êtes notifié, elle s&apos;ajoute à son agenda. Sans appel. Sans groupe WhatsApp.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/auth/register?role=driver"
          className="h-14 px-8 rounded-2xl bg-primary font-bold text-secondary text-base flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all btn-ripple shadow-[0_8px_24px_rgba(255,210,63,0.4)] hover:shadow-[0_12px_32px_rgba(255,210,63,0.5)] hover:-translate-y-0.5">
          <Icon name="directions_car" size={20} />Je suis chauffeur
        </Link>
        <Link href="/auth/register?role=patron"
          className="h-14 px-8 rounded-2xl bg-white/10 border border-white/20 font-bold text-white text-base flex items-center justify-center gap-2 hover:bg-white/20 transition-all btn-ripple">
          <Icon name="corporate_fare" size={20} />Je gère une flotte
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-6 mt-10">
        {TRUST_BADGES.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <Icon name={b.icon} size={16} className="text-primary" />
            <span className="text-white/60 text-xs font-semibold">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
