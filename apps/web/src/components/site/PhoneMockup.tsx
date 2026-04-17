export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] md:w-[300px]">
      <div className="bg-ink rounded-[40px] p-3 shadow-xl rotate-[2deg]">
        <div className="bg-paper rounded-[28px] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <span className="text-[10px] font-semibold text-ink">9:41</span>
            <span className="text-[10px] text-ink/60">••••• 5G</span>
          </div>

          {/* Floating notification */}
          <div className="mx-3 mb-2 bg-ink rounded-xl px-3 py-2 shadow-float">
            <p className="text-[9px] text-paper/60">Il y a 2s · TaxiLink</p>
            <p className="text-[10px] text-paper font-medium leading-snug">Karim a pris votre course Timone · 32€</p>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2">
            <div>
              <p className="text-[11px] font-bold text-ink">Courses dispo</p>
              <p className="text-[9px] text-warm-500">12 à proximité</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-warm-200 flex items-center justify-center">
              <span className="text-[9px] font-bold text-ink">YB</span>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 px-4 mb-2">
            <span className="text-[9px] font-semibold bg-ink text-paper px-2 py-1 rounded-full">Médical</span>
            <span className="text-[9px] font-semibold border border-warm-200 text-warm-600 px-2 py-1 rounded-full">Privé</span>
          </div>

          {/* Course card 1 — urgent */}
          <div className="mx-3 mb-2 border border-warm-200 rounded-xl overflow-hidden">
            <div className="bg-brand px-3 py-1 flex items-center gap-1.5">
              <span className="text-[8px] font-bold text-ink uppercase tracking-wider">URGENT · 3 MIN</span>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-semibold text-warm-500">Médical · Taxi13</span>
                <span className="text-[11px] font-bold text-ink">45€</span>
              </div>
              <p className="text-[9px] text-ink leading-snug">La Belle de Mai 13003</p>
              <p className="text-[9px] text-warm-500">→ Hôpital Nord 13015</p>
            </div>
          </div>

          {/* Course card 2 */}
          <div className="mx-3 mb-2 border border-warm-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-semibold text-warm-500">Médical</span>
              <span className="text-[11px] font-bold text-ink">18€</span>
            </div>
            <p className="text-[9px] text-ink">Castellane → Timone</p>
            <p className="text-[9px] text-warm-500 mt-0.5">12 min</p>
          </div>

          {/* Earnings badge */}
          <div className="mx-3 bg-ink rounded-xl px-3 py-2">
            <p className="text-[8px] text-paper/50 uppercase tracking-wide">Cette semaine</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[16px] font-serif text-paper leading-none">842€</span>
              <span className="text-[9px] text-brand font-semibold">↑ 18%</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
