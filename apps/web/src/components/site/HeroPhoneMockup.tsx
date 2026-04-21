import { Lock } from 'lucide-react'

export function HeroPhoneMockup() {
  return (
    <div className="w-[280px] bg-ink rounded-[36px] p-2.5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.25)] relative z-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[92px] h-[26px] bg-ink rounded-b-[14px] z-20" />
      <div className="bg-white rounded-[28px] overflow-hidden min-h-[560px] pb-[60px] relative">
        <div className="px-5 pt-3 pb-1.5 flex justify-between text-[11.5px] font-bold">
          <span>9:41</span>
          <span className="w-10 h-2.5 rounded-sm bg-ink/80" />
        </div>

        <div className="px-4 pt-3">
          <div className="flex gap-2 pb-3">
            <PhoneTab on label="Tout" count="1" />
            <PhoneTab label="Médical" count="1" />
            <PhoneTab label="Privé" count="0" />
          </div>
          <div className="flex gap-1.5 pb-3.5 overflow-x-auto">
            <PhoneChip on>Tous</PhoneChip>
            <PhoneChip>Taxi13</PhoneChip>
            <PhoneChip>Public</PhoneChip>
          </div>
        </div>

        <div className="px-4">
          <div className="border-[1.5px] border-teal-500 rounded-2xl p-3 bg-white">
            <div className="flex justify-between items-start gap-2.5">
              <div className="flex gap-1.5">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-ink text-white">Médical</span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-white text-ink border-[1.5px] border-warm-200">Taxi13</span>
              </div>
              <div className="text-[10.5px] text-warm-300 leading-tight text-right pt-0.5">dans 13h24 · Dupont</div>
            </div>

            <div className="flex justify-between gap-3 mt-2.5">
              <div className="flex gap-2.5 flex-1">
                <div className="flex flex-col items-center pt-1.5 gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-ink" />
                  <div className="w-[1.5px] flex-1 min-h-[18px]" style={{ backgroundImage: 'linear-gradient(to bottom, #D4D4D8 50%, transparent 50%)', backgroundSize: '2px 4px' }} />
                  <div className="w-3 h-3 rounded-full bg-brand border-2 border-ink box-border" />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-ink leading-tight">12 Rue de la République</div>
                  <div className="text-[10.5px] text-warm-500">13001 Marseille, France</div>
                  <div className="text-[12px] font-bold text-ink leading-tight mt-2.5">Voie sans nom hopital nord</div>
                  <div className="text-[10.5px] text-warm-500">13015 Marseille</div>
                </div>
              </div>
              <div className="text-right shrink-0 pt-[34px]">
                <div className="text-[9.5px] font-bold tracking-widest text-warm-500 uppercase mb-0.5">Prix estimé</div>
                <div className="text-[24px] font-extrabold tracking-tight text-ink leading-none">76€</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2.5 border-t border-warm-100 text-[11px] text-warm-600">
              <span><b className="text-ink">10,4 km</b></span>
              <span className="text-warm-300">·</span>
              <span><b className="text-ink">23 min</b></span>
              <span className="text-warm-300">·</span>
              <span className="font-extrabold text-ink">CPAM</span>
              <span className="text-warm-300">·</span>
              <span className="text-warm-300">HDJ</span>
            </div>

            <div className="mt-2.5 bg-ink text-white rounded-xl py-2.5 flex items-center justify-center gap-2 text-[12px] font-bold">
              <Lock className="w-3 h-3" strokeWidth={2} />
              Maintenir 2s pour accepter
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneTab({ on, label, count }: { on?: boolean; label: string; count: string }) {
  return (
    <div className={`flex-1 text-[12.5px] font-bold py-2 px-2 rounded-full text-center inline-flex items-center justify-center gap-1.5 border-[1.5px] ${
      on ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-warm-200'
    }`}>
      {label} <span className={`text-[11.5px] font-bold ${on ? 'opacity-85' : 'text-warm-500'}`}>{count}</span>
    </div>
  )
}

function PhoneChip({ on, children }: { on?: boolean; children: React.ReactNode }) {
  return (
    <div className={`text-[12px] font-bold py-1.5 px-3 rounded-full inline-flex items-center gap-1.5 border-[1.5px] ${
      on ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-warm-200'
    }`}>
      {on && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
      {children}
    </div>
  )
}
