import { cn } from '@/lib/utils'
import { getMissionTypeColors, getMissionTypeLabel } from '@/lib/utils'

interface BadgeProps {
  type: string
  className?: string
}

export function MissionTypeBadge({ type, className }: BadgeProps) {
  const { bg, text } = getMissionTypeColors(type)
  return (
    <span className={cn('badge', bg, text, className)}>
      {getMissionTypeLabel(type)}
    </span>
  )
}
