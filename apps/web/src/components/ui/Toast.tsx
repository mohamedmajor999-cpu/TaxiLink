'use client'

import { Icon } from './Icon'
import { useToastItem } from './useToastItem'

export type ToastData = {
  id: string
  message: string
  sub?: string
  type?: 'success' | 'info' | 'warning'
}

type Props = {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

const COLORS = {
  success: 'bg-green-600',
  info: 'bg-secondary',
  warning: 'bg-primary',
}

const ICONS = {
  success: 'check_circle',
  info: 'notifications',
  warning: 'warning',
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const { visible, dismiss } = useToastItem(toast.id, onDismiss)
  const type = toast.type ?? 'info'

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-card text-white max-w-sm transition-all duration-300 ${COLORS[type]} ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <Icon name={ICONS[type]} size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-snug">{toast.message}</p>
        {toast.sub && <p className="text-xs text-white/70 mt-0.5 truncate">{toast.sub}</p>}
      </div>
      <button
        onClick={dismiss}
        className="text-white/60 hover:text-white transition-colors"
        aria-label="Fermer"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}
