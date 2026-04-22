interface Props {
  total: number
  active: number
  variant?: 'light' | 'dark'
}

export function OnboardingDots({ total, active, variant = 'light' }: Props) {
  const base = variant === 'dark' ? 'bg-white/20' : 'bg-warm-200'
  const on   = variant === 'dark' ? 'bg-brand'    : 'bg-ink'

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={`h-2 rounded-full transition-all duration-300 ${
            i === active ? `${on} w-7` : `${base} w-2`
          }`}
        />
      ))}
    </div>
  )
}
