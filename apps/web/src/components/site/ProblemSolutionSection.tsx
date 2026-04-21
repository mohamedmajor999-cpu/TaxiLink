import { ProblemWhatsappCard } from './ProblemWhatsappCard'
import { SolutionTaxilinkCard } from './SolutionTaxilinkCard'

export function ProblemSolutionSection() {
  return (
    <section className="max-w-7xl mx-auto px-8 py-14">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[1.5px] px-3 py-1.5 rounded-md bg-brand/10 text-[#D97706] mb-4">
          Le changement
        </div>
        <h2 className="font-extrabold tracking-[-1.8px] leading-[1.05] text-[clamp(32px,5vw,56px)] max-w-[16ch] mx-auto">
          Plus efficace. <span className="text-warm-300">Moins de temps perdu.</span>
        </h2>
        <p className="text-[16.5px] text-warm-500 max-w-[520px] mx-auto mt-4 leading-relaxed">
          Un outil métier, pas une messagerie.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-[18px] p-7 bg-warm-50 border border-warm-200 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10.5px] font-extrabold tracking-[1px] uppercase px-2 py-1 rounded bg-[#EF4444] text-white">Avant</span>
            <span className="text-[12px] text-warm-500 font-medium">WhatsApp · 47 membres</span>
          </div>
          <h3 className="font-extrabold tracking-[-1.2px] text-[32px] leading-[1.1] mb-2">Les problèmes.</h3>
          <p className="text-[14.5px] text-warm-500 mb-6">Messages perdus. Adresses floues. Doublons.</p>
          <div className="mt-auto"><ProblemWhatsappCard /></div>
        </div>

        <div className="rounded-[18px] p-7 bg-gradient-to-b from-[#F9FAFB] to-white border border-warm-200 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[10.5px] font-extrabold tracking-[1px] uppercase px-2 py-1 rounded bg-brand text-ink">Après</span>
            <span className="text-[12px] text-warm-500 font-medium">TaxiLink · groupe privé</span>
          </div>
          <h3 className="font-extrabold tracking-[-1.2px] text-[32px] leading-[1.1] mb-2">La solution.</h3>
          <p className="text-[14.5px] text-warm-500 mb-6">Une course, un propriétaire, un historique.</p>
          <div className="mt-auto"><SolutionTaxilinkCard /></div>
        </div>
      </div>
    </section>
  )
}
