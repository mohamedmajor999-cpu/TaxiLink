import { Mic, Users, Check, Calendar } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type FeatTone = 'amber' | 'teal' | 'blue' | 'green'

const FEATURES: Array<{ icon: LucideIcon; tone: FeatTone; title: string; desc: string }> = [
  { icon: Mic,      tone: 'amber', title: 'Voix',           desc: "Dictez la course, l'IA remplit tout." },
  { icon: Users,    tone: 'teal',  title: 'Groupes privés', desc: 'Vos collègues, rien qu\'eux.' },
  { icon: Check,    tone: 'blue',  title: 'Appui long',     desc: 'Un geste, course attribuée.' },
  { icon: Calendar, tone: 'green', title: 'Agenda auto',    desc: 'Synchro Google & Apple.' },
]

const TONE_CLASSES: Record<FeatTone, string> = {
  amber: 'bg-amber-100 text-amber-600',
  teal:  'bg-teal-50 text-teal-600',
  blue:  'bg-blue-50 text-blue-500',
  green: 'bg-green-50 text-green-600',
}

export function FeaturesSection() {
  return (
    <section id="produit" className="max-w-7xl mx-auto py-10 md:py-14">
      <div className="text-center mb-8 px-5 md:px-8">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[1.5px] px-3 py-1.5 rounded-md bg-teal-50 text-teal-600 mb-4">
          Fonctionnalités
        </div>
        <h2 className="font-extrabold tracking-[-1.8px] leading-[1.05] text-[clamp(32px,5vw,56px)] max-w-[16ch] mx-auto">
          4 outils. <span className="text-warm-300">1 seule app.</span>
        </h2>
      </div>

      <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-5 pb-2 -mx-px">
        {FEATURES.map(({ icon: Icon, tone, title, desc }, i) => (
          <div key={title} className="snap-start shrink-0 w-[78%] max-w-[300px] bg-white border border-warm-200 rounded-[20px] p-5 flex flex-col shadow-subtle">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${TONE_CLASSES[tone]}`}>
              <Icon className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="text-[11px] font-bold tracking-[1.2px] uppercase text-warm-300 mb-1.5">{`0${i + 1}`}</div>
            <h4 className="font-extrabold tracking-[-0.6px] text-[22px] leading-tight mb-2">{title}</h4>
            <p className="text-[14px] text-warm-500 leading-relaxed">{desc}</p>
          </div>
        ))}
        <div aria-hidden className="shrink-0 w-3" />
      </div>

      <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-8">
        {FEATURES.map(({ icon: Icon, tone, title, desc }) => (
          <div key={title} className="bg-white border border-warm-200 rounded-[18px] p-5 md:p-7 min-h-0 md:min-h-[240px] flex flex-col transition-all hover:-translate-y-[3px] hover:shadow-[0_20px_40px_-16px_rgba(0,0,0,0.12)] hover:border-warm-300">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-[18px] ${TONE_CLASSES[tone]}`}>
              <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
            </div>
            <h4 className="font-extrabold tracking-[-0.6px] text-[20px] leading-tight mb-2">{title}</h4>
            <p className="text-[13.5px] text-warm-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
