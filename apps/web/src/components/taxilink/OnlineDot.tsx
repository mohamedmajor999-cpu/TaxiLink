type Size = 'sm' | 'md'

interface Props {
  online?: boolean
  size?: Size
  className?: string
}

const SIZES: Record<Size, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
}

export function OnlineDot({ online = true, size = 'md', className = '' }: Props) {
  if (!online) {
    return (
      <span
        className={`relative inline-block ${SIZES[size]} rounded-full bg-warm-300 ${className}`}
        aria-label="Hors ligne"
      />
    )
  }
  return (
    <span
      className={`relative inline-block ${SIZES[size]} ${className}`}
      aria-label="En ligne"
    >
      <span className="absolute inset-0 rounded-full bg-brand" />
      <span className="absolute inset-0 rounded-full bg-brand opacity-60 motion-safe:animate-ping" />
    </span>
  )
}
