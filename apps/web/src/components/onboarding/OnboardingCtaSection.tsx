import { type RefObject } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

interface Props {
  sectionRef: RefObject<HTMLDivElement>
}

const perks = [
  { icon: 'check_circle', label: 'Accès illimité · toujours gratuit' },
  { icon: 'check_circle', label: '0% commission sur vos courses' },
  { icon: 'lock',         label: 'Données sécurisées · France' },
]

export function OnboardingCtaSection({ sectionRef }: Props) {
  return (
    <section ref={sectionRef} className="bg-secondary py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2 mb-8">
          <Icon name="star" size={16} className="text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">100% Gratuit · Toujours</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
          Prêt à rejoindre<br />
          <span className="text-primary">le réseau ?</span>
        </h2>

        <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
          Accès illimité, zéro commission, données hébergées en France.
          TaxiLink Pro est et restera gratuit.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {perks.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon name={icon} size={16} className="text-primary" />
              <span className="text-white/70 text-sm font-semibold">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register?role=driver"
            className="h-14 px-8 rounded-2xl bg-primary font-bold text-secondary text-base flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all btn-ripple shadow-[0_8px_24px_rgba(255,210,63,0.3)]">
            <Icon name="directions_car" size={20} />
            Je suis chauffeur
          </Link>
          <Link href="/auth/register?role=patron"
            className="h-14 px-8 rounded-2xl bg-white/10 border border-white/20 font-bold text-white text-base flex items-center justify-center gap-2 hover:bg-white/20 transition-all btn-ripple">
            <Icon name="corporate_fare" size={20} />
            Je gère une flotte
          </Link>
        </div>
      </div>
    </section>
  )
}
