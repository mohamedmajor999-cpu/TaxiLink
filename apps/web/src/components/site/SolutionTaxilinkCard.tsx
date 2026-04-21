import { Check, Lock } from 'lucide-react'

export function SolutionTaxilinkCard() {
  return (
    <div className="flex flex-col gap-3.5 max-w-[520px] mx-auto">
      <div className="bg-white border-[1.5px] border-teal-500 rounded-[18px] p-5 shadow-[0_16px_40px_-14px_rgba(20,184,166,0.28)] relative">
        <div className="flex justify-between items-start gap-2.5 mb-3">
          <div className="flex gap-1.5">
            <span className="text-[12.5px] font-bold px-2.5 py-1 rounded-md bg-ink text-white">Médical</span>
            <span className="text-[12.5px] font-bold px-2.5 py-1 rounded-md bg-white text-ink border-[1.5px] border-warm-200">Taxi13</span>
          </div>
          <div className="text-[12.5px] text-warm-500 text-right pt-1">dans 13h24 · Dupont</div>
        </div>

        <div className="flex justify-between gap-3">
          <div className="flex gap-2.5 flex-1">
            <div className="flex flex-col items-center pt-1.5 gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-ink" />
              <div className="w-[1.5px] flex-1 min-h-[22px]" style={{ backgroundImage: 'linear-gradient(to bottom, #D4D4D8 50%, transparent 50%)', backgroundSize: '2px 4px' }} />
              <div className="w-3 h-3 rounded-full bg-brand border-2 border-ink box-border" />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-bold text-ink leading-tight">12 Rue de la République</div>
              <div className="text-[13px] text-warm-500 mt-0.5">13001 Marseille, France</div>
              <div className="text-[15px] font-bold text-ink leading-tight mt-3.5">Voie sans nom hopital nord</div>
              <div className="text-[13px] text-warm-500 mt-0.5">13015 Marseille</div>
            </div>
          </div>
          <div className="text-right shrink-0 pt-1">
            <div className="text-[10.5px] font-bold tracking-widest text-warm-500 uppercase mb-1">Prix estimé</div>
            <div className="text-[34px] font-extrabold tracking-tight text-ink leading-none">76€</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mt-3.5 pt-3 border-t border-warm-100 text-[14px] text-warm-600">
          <span><b className="text-ink">10,4 km</b></span>
          <span className="text-warm-300">·</span>
          <span><b className="text-ink">23 min</b></span>
          <span className="text-warm-300">·</span>
          <span className="font-extrabold text-ink">CPAM</span>
          <span className="text-warm-300">·</span>
          <span className="text-warm-300">HDJ</span>
        </div>

        <div className="mt-3.5 bg-[#0F1419] text-white rounded-2xl py-5 px-5 flex items-center justify-center gap-3.5 text-[16px] font-bold relative overflow-hidden">
          <Lock className="w-[18px] h-[18px] shrink-0" strokeWidth={1.6} />
          <span>Maintenir 2s pour accepter</span>
          <span className="absolute left-0 bottom-0 h-[2.5px] bg-brand" style={{ width: '70%' }} />
        </div>
      </div>

      <div className="flex items-center gap-3 bg-[#ECFDF5] border border-emerald-500/25 rounded-xl px-4 py-3.5">
        <div className="w-[34px] h-[34px] rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0">
          <Check className="w-4 h-4" strokeWidth={2.2} />
        </div>
        <div className="text-[14px] text-warm-600 leading-snug">
          <b className="text-ink font-bold">Karim M.</b> a accepté la course
        </div>
        <div className="ml-auto text-[11.5px] text-teal-600 font-semibold tracking-wider">38 SEC</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {['Un seul propriétaire', 'Adresse exacte', 'Aucun doublon', 'Historique complet'].map((t) => (
          <div key={t} className="bg-white border border-warm-200 rounded-[10px] px-3.5 py-2.5 flex items-center gap-2.5 text-[13px] text-warm-600 font-semibold">
            <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5" strokeWidth={2.4} />
            </span>
            {t}
          </div>
        ))}
      </div>
    </div>
  )
}
