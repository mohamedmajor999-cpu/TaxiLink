// Donnees fictives pour le mockup. Ne pas remplacer par de vrais noms /
// numeros : la landing est publique, toute personne mentionnee pourrait
// faire valoir un droit a l'effacement (RGPD art. 17) + plainte CNIL.
const MESSAGES = [
  { sender: 'Karim Régul',  color: '#FFA726', body: '13H30 13014 → 13011', time: '13:11' },
  { sender: '~Sami',        color: '#FF8A9B', phone: '+33 6 12 34 56 78', body: 'Nord → Châteauneuf les Martigues J\'ai', time: '13:13' },
  { sender: 'Karim Régul',  color: '#FFA726', body: '14H 13015 → TIMONE', time: '13:35' },
  { sender: 'Karim Régul',  color: '#FFA726', body: '14H30 13014 → ST JOSEPH', time: '13:43' },
  { sender: '~Lina 265',    color: '#53BDEB', phone: '+33 6 98 76 54 32', quote: { name: 'Karim Régul', text: '14H30 13014 → ST JOSEPH' }, body: 'Okok', time: '13:43' },
  { sender: 'Karim Régul',  color: '#FFA726', quote: { name: '~Lina 265', text: 'Okok' }, body: 'Dsl placé merci quand même', time: '13:44' },
  { sender: '~Théo P.',     color: '#06CF9C', phone: '+33 6 11 22 33 44', body: 'Aix pr Trets', time: '14:03' },
]

export function ProblemWhatsappCard() {
  return (
    <div className="bg-[#0B141A] rounded-2xl overflow-hidden border border-white/10 shadow-toast max-w-[440px] mx-auto relative">
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#202C33] border-b border-white/5 text-[#E9EDEF]">
        <span className="text-[#53BDEB] text-[20px] font-normal">‹</span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-[#F59E0B] text-ink flex items-center justify-center text-[14px] font-extrabold shrink-0">S</div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-[#E9EDEF] truncate">Solutions Médicales Marseille</div>
          <div className="text-[11px] text-[#8696A0] mt-0.5">8 en ligne</div>
        </div>
      </div>

      <div className="px-3.5 py-4 flex flex-col gap-2 bg-[#0B141A] max-h-[420px] overflow-y-auto">
        {MESSAGES.map((m, i) => (
          <div key={i} className="bg-[#202C33] text-[#E9EDEF] px-3.5 py-2.5 rounded-lg text-[14px] leading-snug relative">
            <div className="text-[13px] font-semibold leading-tight mb-0.5" style={{ color: m.color }}>
              {m.sender}
              {m.phone && <span className="text-[#8696A0] text-[12px] font-normal ml-2">{m.phone}</span>}
            </div>
            {m.quote && (
              <div className="bg-[rgba(6,207,156,0.08)] border-l-[3px] border-[#06CF9C] pl-3 py-1.5 rounded mb-1.5 text-[13px]">
                <div className="text-[#06CF9C] font-semibold">{m.quote.name}</div>
                <div className="text-[#A7B0B4]">{m.quote.text}</div>
              </div>
            )}
            <span className="block">{m.body}</span>
            <span className="float-right text-[11.5px] text-white/45 ml-2 mt-1">{m.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
