import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

const TRUST_BADGES = [
  { icon: 'verified',      label: 'Chauffeurs vérifiés'  },
  { icon: 'lock',          label: 'Paiements sécurisés'  },
  { icon: 'support_agent', label: 'Support 7j/7'          },
]

export function HeroText() {
  return (
    <div>
      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
        <div className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
        <span className="text-white/80 text-xs font-semibold">+2 400 chauffeurs actifs en France</span>
      </div>

      <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
        La plateforme<br />
        <span className="text-primary">N°1</span> des<br />
        chauffeurs pro
      </h1>

      <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-md">
        Gérez vos missions, votre agenda et vos revenus en temps réel.
        Connectez-vous aux patients CPAM, clients privés et plateformes partenaires.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/auth/register?role=driver"
          className="h-14 px-8 rounded-2xl bg-primary font-bold text-secondary text-base flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all btn-ripple shadow-[0_8px_24px_rgba(255,210,63,0.4)] hover:shadow-[0_12px_32px_rgba(255,210,63,0.5)] hover:-translate-y-0.5">
          <Icon name="directions_car" size={20} />Je suis chauffeur
        </Link>
        <Link href="/auth/register?role=client"
          className="h-14 px-8 rounded-2xl bg-white/10 border border-white/20 font-bold text-white text-base flex items-center justify-center gap-2 hover:bg-white/20 transition-all btn-ripple">
          <Icon name="person" size={20} />Je cherche un taxi
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
