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

function StarOfLife({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g fill="currentColor">
        <rect x="10.5" y="2" width="3" height="20" rx="1.2" />
        <rect x="10.5" y="2" width="3" height="20" rx="1.2" transform="rotate(60 12 12)" />
        <rect x="10.5" y="2" width="3" height="20" rx="1.2" transform="rotate(120 12 12)" />
      </g>
    </svg>
  )
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
      {variant === 'medical' && <StarOfLife className="w-3 h-3 -ml-0.5" />}
      {children}
    </span>
  )
}
