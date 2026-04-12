import { Icon } from '@/components/ui/Icon'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
      <Icon name="error" size={20} className="text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-600 font-semibold flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold text-red-500 underline underline-offset-2 hover:text-red-700"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}
