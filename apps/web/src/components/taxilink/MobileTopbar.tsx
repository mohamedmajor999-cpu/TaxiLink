'use client'
import { Menu } from 'lucide-react'

interface Props {
  variant: 'floating' | 'bar'
  hasNotif?: boolean
  onOpen: () => void
}

export function MobileTopbar({ variant, hasNotif, onOpen }: Props) {
  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Ouvrir le menu"
        className="md:hidden fixed top-3 left-3 z-[600] w-11 h-11 rounded-full bg-paper/95 dark:bg-night-surface/95 backdrop-blur-md border border-warm-200 dark:border-night-border shadow-[0_4px_14px_rgba(0,0,0,0.12)] flex items-center justify-center text-ink dark:text-night-text active:scale-95 transition-transform"
        style={{ marginTop: 'env(safe-area-inset-top)' }}
      >
        <Menu className="w-5 h-5" strokeWidth={2} />
        {hasNotif && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-danger ring-2 ring-paper dark:ring-night-surface" aria-hidden="true" />
        )}
      </button>
    )
  }
  return (
    <div
      className="md:hidden fixed top-0 left-0 right-0 z-[600] flex items-center h-14 px-3 bg-paper/95 dark:bg-night-surface/95 backdrop-blur-md border-b border-warm-200 dark:border-night-border"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label="Ouvrir le menu"
        className="relative w-10 h-10 rounded-full hover:bg-warm-50 dark:hover:bg-night-elevated flex items-center justify-center text-ink dark:text-night-text active:scale-95 transition-transform"
      >
        <Menu className="w-5 h-5" strokeWidth={2} />
        {hasNotif && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-danger ring-2 ring-paper dark:ring-night-surface" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
