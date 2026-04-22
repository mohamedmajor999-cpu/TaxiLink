const BARS = [28, 52, 78, 94, 100, 88, 68, 44, 26, 18]

export function SlideIlloVoice() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-[6px] h-40">
        {BARS.map((h, i) => (
          <span
            key={i}
            aria-hidden
            className={`w-2 rounded-full ${i === 4 ? 'bg-ink' : 'bg-brand'}`}
            style={{
              height: `${h}%`,
              animation: 'voiceBar 0.9s ease-in-out infinite',
              animationDelay: `${i * 0.09}s`,
              transformOrigin: 'center',
            }}
          />
        ))}
      </div>
      <div className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-brand text-[11px] font-bold uppercase tracking-[0.12em]">
        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
        Dictée · 0:03
      </div>
    </div>
  )
}
