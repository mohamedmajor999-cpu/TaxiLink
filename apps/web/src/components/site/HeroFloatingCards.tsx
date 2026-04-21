import { Check, Mic } from 'lucide-react'

const BAR_HEIGHTS = [45, 80, 100, 60, 90, 50, 70]

export function HeroFloatingCardsLeft() {
  return (
    <div className="flex flex-col gap-5 items-end">
      <div className="bg-white border border-warm-200 rounded-xl p-4 shadow-float max-w-[260px] w-full animate-float-a will-change-transform">
        <div className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-2">Dictée vocale</div>
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <span className="absolute inset-0 rounded-full bg-brand animate-mic-ring" aria-hidden />
            <div className="relative w-9 h-9 rounded-full bg-brand flex items-center justify-center animate-mic-pulse">
              <Mic className="w-3.5 h-3.5 text-ink" strokeWidth={2.2} />
            </div>
          </div>
          <div className="flex items-end gap-[3px] h-5 flex-1">
            {BAR_HEIGHTS.map((h, i) => (
              <span
                key={i}
                className="w-[2.5px] rounded-sm bg-brand origin-bottom animate-voice-bar"
                style={{ height: `${h}%`, animationDelay: `${i * 0.11}s` }}
              />
            ))}
          </div>
        </div>
        <div className="text-[13px] font-medium text-ink mt-2.5 leading-snug">&quot;CPAM, Timone vers CHU Nord, demain 8h30&quot;</div>
      </div>

      <div className="bg-white border border-warm-200 rounded-xl p-4 shadow-float max-w-[260px] w-full animate-float-b will-change-transform">
        <div className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-2">Groupe privé</div>
        <div className="flex items-center gap-2.5">
          <div className="flex">
            {[
              { t: 'KM', bg: '#FBBF24', fg: '#18181B' },
              { t: 'SB', bg: '#14B8A6', fg: '#fff' },
              { t: 'YA', bg: '#3B82F6', fg: '#fff' },
              { t: '+5', bg: '#8B5CF6', fg: '#fff' },
            ].map((a, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10.5px] font-bold first:ml-0 -ml-2"
                style={{ background: a.bg, color: a.fg }}>{a.t}</div>
            ))}
          </div>
          <div className="text-[12.5px] text-warm-500 font-medium">Vieux-Port · 8 membres</div>
        </div>
      </div>
    </div>
  )
}

export function HeroFloatingCardsRight() {
  return (
    <div className="flex flex-col gap-5 items-start">
      <div className="bg-white border border-warm-200 rounded-xl p-4 shadow-float max-w-[260px] w-full animate-float-c will-change-transform">
        <div className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-2">Notification</div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 animate-pop-in" style={{ animationDelay: '0.3s' }}>
            <Check className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="text-[13px] leading-snug">
            <span className="font-bold text-ink">Karim M.</span> a accepté<br />
            <span className="text-warm-500">Timone → CHU · 08h30</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-warm-200 rounded-xl p-4 shadow-float max-w-[260px] w-full animate-float-d will-change-transform">
        <div className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-2">Temps d&apos;acceptation</div>
        <div className="flex items-end gap-2.5 justify-between">
          <div className="font-bold text-[30px] tracking-tight leading-none">
            38<sup className="text-[14px] text-brand font-bold">s</sup>
          </div>
          <div className="text-[11.5px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">−6s</div>
        </div>
      </div>
    </div>
  )
}
