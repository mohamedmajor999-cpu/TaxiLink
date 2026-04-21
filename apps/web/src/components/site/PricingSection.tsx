import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const FEATURES = [
  { title: 'Dictée vocale illimitée',   desc: 'Créez vos courses en 3 secondes, mains libres.' },
  { title: 'Groupes privés illimités',  desc: 'Vos collègues de confiance, rien qu\'eux.' },
  { title: 'Agenda synchronisé',        desc: 'Google & Apple. Tout au même endroit.' },
  { title: 'Historique complet',        desc: 'Toutes vos courses, exportables à tout moment.' },
]

export function PricingSection() {
  return (
    <section id="tarifs" className="max-w-7xl mx-auto px-8 py-14">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[1.5px] px-3 py-1.5 rounded-md bg-brand/10 text-[#D97706] mb-4">
          Tarifs
        </div>
        <h2 className="font-extrabold tracking-[-1.8px] leading-[1.05] text-[clamp(32px,5vw,56px)] max-w-[16ch] mx-auto">
          Une seule ligne. <span className="text-warm-300">Zéro complication.</span>
        </h2>
        <p className="text-[16.5px] text-warm-500 max-w-[520px] mx-auto mt-4 leading-relaxed">
          Pas d&apos;abonnement. Pas de commission. Pas de carte bancaire.
        </p>
      </div>

      <div className="bg-ink text-white rounded-[18px] p-10 md:p-20 grid md:grid-cols-[1.1fr_1fr] gap-10 md:gap-20 items-center relative overflow-hidden">
        <div className="absolute -top-[120px] -right-[120px] w-[420px] h-[420px] rounded-full bg-brand opacity-[0.12] blur-xl pointer-events-none" />
        <div className="absolute -bottom-20 left-[30%] w-[300px] h-[300px] rounded-full bg-teal-500 opacity-[0.08] blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.12em] uppercase text-brand border border-brand/30 bg-brand/[0.06] px-3 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--tw-shadow-color)] shadow-brand" />
            Pour les chauffeurs
          </div>
          <h3 className="font-extrabold tracking-[-3px] leading-[0.95] text-[clamp(56px,7vw,96px)] mb-6">
            <span className="text-brand block">Gratuit.</span>
          </h3>
          <p className="text-[17px] text-warm-300 max-w-[42ch] leading-relaxed mb-9">
            TaxiLink est et restera gratuit pour tous les chauffeurs de taxi.
          </p>
          <div className="flex items-center gap-3.5 flex-wrap">
            <Link href="/auth/register" className="inline-flex items-center gap-2.5 bg-brand text-ink font-bold text-[15px] px-6 py-4 rounded-lg hover:-translate-y-px transition-all">
              Créer mon compte
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
            <span className="text-[11.5px] text-warm-300 tracking-wider font-medium">2 MIN · SANS CB</span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10 md:pl-12 md:border-l border-white/[0.08]">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <div className="w-9 h-9 rounded-full bg-brand/[0.14] text-brand flex items-center justify-center mb-1">
                <Check className="w-[18px] h-[18px]" strokeWidth={2.2} />
              </div>
              <h5 className="font-extrabold tracking-[-0.6px] text-[22px] leading-tight">{f.title}</h5>
              <p className="text-[14.5px] text-warm-300 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
