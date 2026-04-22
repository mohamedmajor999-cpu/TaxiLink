type Variant = 'default' | 'accent'

interface Props {
  variant?: Variant
  children: React.ReactNode
}

export function Chip({ variant = 'default', children }: Props) {
  const base = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold'
  const styles: Record<Variant, string> = {
    default: 'bg-warm-100 text-ink',
    accent: 'bg-brand text-ink',
  }
  return <span className={`${base} ${styles[variant]}`}>{children}</span>
}
