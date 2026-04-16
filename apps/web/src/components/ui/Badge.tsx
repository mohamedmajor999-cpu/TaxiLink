import { cn } from '@/lib/cn'
import { getMissionTypeColors, getMissionTypeLabel } from '@/lib/missionDisplay'

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
