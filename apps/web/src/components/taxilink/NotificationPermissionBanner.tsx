'use client'
import { Bell, X } from 'lucide-react'
import { useNotificationPermissionBanner } from './useNotificationPermissionBanner'

interface Props {
  onActivate: () => void
}

export function NotificationPermissionBanner({ onActivate }: Props) {
  const { dismissed, dismiss } = useNotificationPermissionBanner()
  if (dismissed) return null
  return (
    <div
      role="status"
      className="mb-4 rounded-xl bg-brand/15 border border-brand/50 px-4 py-3 flex items-center gap-3"
    >
      <Bell className="w-4 h-4 text-ink shrink-0" strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-ink">Activer les notifications</p>
        <p className="text-[12px] text-warm-600">Recevez un rappel 15 min avant chaque course.</p>
      </div>
      <button
        type="button"
        onClick={onActivate}
        className="shrink-0 h-8 px-3 rounded-lg bg-ink text-paper text-[12px] font-semibold hover:bg-warm-800 transition-colors"
      >
        Activer
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Ignorer la demande de notifications"
        className="shrink-0 w-7 h-7 rounded-full hover:bg-warm-50 flex items-center justify-center"
      >
        <X className="w-3.5 h-3.5 text-warm-500" strokeWidth={2} />
      </button>
    </div>
  )
}
