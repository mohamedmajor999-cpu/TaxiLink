'use client'

import { Icon } from './Icon'
import { useToastItem } from './useToastItem'

export type ToastData = {
  id: string
  message: string
  sub?: string
  trailing?: string
  type?: 'success' | 'info' | 'warning' | 'publish' | 'mission'
  /** Override de la durée d'auto-dismiss en ms (defaut 4000ms). */
  duration?: number
  /** Si défini, la toast est cliquable et appelle ce callback (ex: ouvrir le détail). */
  onClick?: () => void
}

type Props = {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

const COLORS = {
  success: 'bg-green-600 text-white',
  info: 'bg-secondary text-white',
  warning: 'bg-primary text-white',
  publish: 'bg-secondary text-primary',
  mission: 'bg-ink text-paper border border-brand/40',
}

const ICONS = {
  success: 'check_circle',
  info: 'notifications',
  warning: 'warning',
  publish: 'check_circle',
  mission: 'directions_car',
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const { visible, dismiss } = useToastItem(toast.id, onDismiss, toast.duration)
  const type = toast.type ?? 'info'
  const isPublish = type === 'publish'
  const isMission = type === 'mission'
  const subClass = isPublish ? 'text-primary/80' : isMission ? 'text-paper/70' : 'text-white/70'
  const closeClass = isPublish
    ? 'text-primary/60 hover:text-primary'
    : isMission ? 'text-paper/50 hover:text-paper'
    : 'text-white/60 hover:text-white'
  const Wrapper = toast.onClick ? 'button' : 'div'
  const handleClick = toast.onClick
    ? () => { toast.onClick?.(); dismiss() }
    : undefined

  return (
    <Wrapper
      type={toast.onClick ? 'button' : undefined}
      onClick={handleClick}
      className={`pointer-events-auto text-left flex items-start gap-3 px-4 py-3 rounded-2xl shadow-card max-w-sm transition-all duration-300 ${COLORS[type]} ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      } ${toast.onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''}`}
    >
      {isMission && (
        <span className="relative flex-shrink-0 mt-1">
          <span className="block w-2 h-2 rounded-full bg-brand" />
          <span className="absolute inset-[-3px] rounded-full bg-brand/40 motion-safe:animate-ping" />
        </span>
      )}
      {!isMission && <Icon name={ICONS[type]} size={20} className="flex-shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold leading-snug ${isMission ? 'text-brand' : ''}`}>{toast.message}</p>
        {toast.sub && <p className={`text-xs mt-0.5 truncate ${subClass}`}>{toast.sub}</p>}
      </div>
      {toast.trailing && (
        <span className="text-[15px] font-black flex-shrink-0 ml-1 mt-0.5">{toast.trailing}</span>
      )}
      {toast.onClick && !toast.trailing && (
        <Icon name="chevron_right" size={20} className="flex-shrink-0 mt-0.5 text-paper/60" />
      )}
      {!toast.onClick && (
        <button
          onClick={(e) => { e.stopPropagation(); dismiss() }}
          className={`transition-colors ${closeClass}`}
          aria-label="Fermer"
          type="button"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </Wrapper>
  )
}
