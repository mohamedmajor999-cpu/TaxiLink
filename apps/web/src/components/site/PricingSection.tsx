import Link from 'next/link'
import { Check } from 'lucide-react'

const FREE_FEATURES = [
  "Groupe privé jusqu'à 10 membres",
  'Dictée vocale IA illimitée',
  'Agenda, stats, PWA',
  'Support email',
]

const PRO_FEATURES = [
  'Groupe illimité (11+ chauffeurs)',
  'Géolocalisation en temps réel',
  'Dashboard patron (assignation, stats flotte)',
  'Export comptable automatique',
  'Support prioritaire',
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-paper">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-3">Tarifs</p>
          <h2 className="font-serif text-display-md text-ink mb-3">Gratuit jusqu&apos;à 10 chauffeurs.</h2>
          <p className="text-base text-warm-600">Aucune carte bleue. Aucun engagement.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* Card gratuite */}
          <div className="border border-warm-200 rounded-2xl p-8">
            <p className="text-sm font-semibold text-ink mb-2">Indépendant</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-serif text-[48px] leading-none text-ink">0</span>
              <span className="text-lg text-warm-500 font-medium">€</span>
              <span className="text-sm text-warm-500 ml-1">/mois</span>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-warm-600">
                  <Check size={16} strokeWidth={2} className="text-ink shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register"
              className="flex items-center justify-center h-11 rounded-xl border border-warm-200 text-ink text-sm font-semibold hover:bg-warm-50 transition-colors duration-150">
              Commencer gratuitement →
            </Link>
          </div>

          {/* Card flotte */}
          <div className="bg-ink rounded-2xl p-8 relative">
            <div className="absolute top-6 right-6 bg-brand px-2.5 py-0.5 rounded-full">
              <span className="text-[10px] font-bold text-ink uppercase tracking-wider">Flottes</span>
            </div>
            <p className="text-sm font-semibold text-paper mb-2">Flotte</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-serif text-[48px] leading-none text-paper">19</span>
              <span className="text-lg text-paper/60 font-medium">€</span>
              <span className="text-sm text-paper/60 ml-1">/mois par groupe</span>
            </div>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-paper/70">
                  <Check size={16} strokeWidth={2} className="text-brand shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?flotte=true"
              className="flex items-center justify-center h-11 rounded-xl bg-brand text-ink text-sm font-semibold hover:bg-brand/90 transition-colors duration-150">
              Je gère une flotte
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
