import { Icon } from '@/components/ui/Icon'

const MISSIONS = [
  { type: 'Hôpital', from: 'Paris 8e', to: 'Hôpital Lariboisière', price: '32,50€', min: '12 min' },
  { type: 'Privé',   from: 'Gare de Lyon', to: 'Aéroport CDG',     price: '65,00€', min: '25 min' },
]

const DAY_STATS: [string, string][] = [['7', 'Courses'], ['94', 'km'], ['187€', 'Gains']]

export function HeroMockup() {
  return (
    <div className="hidden lg:flex justify-center">
      <div className="relative">
        {/* Phone frame */}
        <div className="w-72 bg-white rounded-[32px] shadow-2xl overflow-hidden border-4 border-white/10">
          {/* App header */}
          <div className="bg-secondary px-5 pt-8 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">Bonjour,</div>
                <div className="text-white font-bold text-lg">Marc Fontaine</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">M</div>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-white text-sm font-semibold">En ligne</span>
              </div>
              <div className="w-12 h-6 rounded-full bg-green-400 flex items-end justify-end px-0.5 pb-0.5">
                <div className="w-5 h-5 rounded-full bg-white" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="px-4 py-4 grid grid-cols-3 gap-2 bg-bgsoft">
            {DAY_STATS.map(([v, l], i) => (
              <div key={l} className={`rounded-xl p-2.5 text-center ${i === 2 ? 'bg-secondary' : 'bg-white shadow-soft'}`}>
                <div className={`text-lg font-black leading-none ${i === 2 ? 'text-primary' : 'text-secondary'}`}>{v}</div>
                <div className={`text-[9px] font-semibold uppercase tracking-wide mt-0.5 ${i === 2 ? 'text-white/40' : 'text-muted'}`}>{l}</div>
              </div>
            ))}
          </div>

          {/* Mission cards */}
          <div className="px-4 pb-4 pt-2 bg-bgsoft space-y-2">
            <div className="text-xs font-bold text-secondary mb-2">Courses disponibles</div>
            {MISSIONS.map((m) => (
              <div key={m.type + m.from} className="bg-white rounded-xl p-3 shadow-soft">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${m.type === 'Hôpital' ? 'bg-primary/20 text-secondary' : 'bg-secondary/10 text-secondary'}`}>{m.type}</span>
                  <span className="text-[10px] text-muted font-semibold">{m.min}</span>
                </div>
                <div className="text-[10px] text-muted truncate">{m.from}</div>
                <div className="text-[10px] font-semibold text-secondary truncate">{m.to}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-black text-secondary">{m.price}</span>
                  <button className="h-6 px-3 rounded-lg bg-primary text-[9px] font-bold text-secondary">Je la prends</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating badge — course prise */}
        <div className="absolute -left-12 top-1/4 bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
            <Icon name="check_circle" size={18} className="text-green-600" />
          </div>
          <div>
            <div className="text-xs font-black text-secondary">Course récupérée</div>
            <div className="text-[10px] text-muted">Karim Benali · il y a 2s</div>
          </div>
        </div>

        {/* Floating badge — notification */}
        <div className="absolute -right-10 bottom-1/3 bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Icon name="notifications_active" size={18} className="text-secondary" />
          </div>
          <div>
            <div className="text-xs font-black text-secondary">Vous êtes notifié</div>
            <div className="text-[10px] text-muted">Ajoutée à son agenda</div>
          </div>
        </div>
      </div>
    </div>
  )
}
