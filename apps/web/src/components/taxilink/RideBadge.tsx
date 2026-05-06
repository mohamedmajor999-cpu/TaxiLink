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
        <svg viewBox="0 0 24 24" className="w-3 h-3 -ml-0.5" aria-hidden="true">
          <path d="M6 4h3v6h6V4h3v16h-3v-6H9v6H6V4z" fill="currentColor" />
        </svg>
      )}
      {children}
    </span>
  )
}
