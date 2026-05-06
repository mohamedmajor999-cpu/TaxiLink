export type RideBadgeVariant = 'medical' | 'private' | 'fleet' | 'public' | 'urgent'

interface Props {
  variant: RideBadgeVariant
  children: React.ReactNode
  className?: string
}

const VARIANT_STYLES: Record<RideBadgeVariant, string> = {
  medical: 'bg-ink text-paper border border-ink',
  private: 'bg-brand text-ink border border-brand',
  fleet: 'bg-transparent text-ink border border-ink/60',
  public: 'bg-transparent text-warm-600 border border-warm-300',
  urgent: 'bg-brand text-ink border border-brand',
}

export function RideBadge({ variant, children, className = '' }: Props) {
  if (variant === 'urgent') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10.5px] font-bold uppercase tracking-wider ${VARIANT_STYLES.urgent} ${className}`}
      >
        {children}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold ${VARIANT_STYLES[variant]} ${className}`}
    >
      {variant === 'medical' && (
        <svg viewBox="0 0 24 24" className="w-4 h-4 -ml-0.5" aria-hidden="true">
          <g fill="currentColor">
            <circle cx="12" cy="2.5" r="1.2" />
            <path d="M3.5 5.5c2-1.2 5-1.5 8.5-1.5s6.5 0.3 8.5 1.5c-2 1.5-5 2-8.5 2s-6.5-0.5-8.5-2z" />
            <rect x="11.3" y="4" width="1.4" height="18" />
          </g>
          <path
            d="M12 8c-2.5 0.5-2.5 2.5 0 3.5s2.5 2.5 0 3.5s-2.5 2.5 0 3.5s2.5 2.5 0 3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M12 8c2.5 0.5 2.5 2.5 0 3.5s-2.5 2.5 0 3.5s2.5 2.5 0 3.5s-2.5 2.5 0 3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      )}
      {children}
    </span>
  )
}
