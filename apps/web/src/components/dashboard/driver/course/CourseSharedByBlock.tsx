'use client'
import { Share2, Users } from 'lucide-react'
import { useCourseSharedBy } from './useCourseSharedBy'

interface Props {
  sharedBy: string | null | undefined
  currentUserId: string | null | undefined
  missionId: string
  visibility: string
}

export function CourseSharedByBlock(props: Props) {
  const { sharerName, isSelf, groupNames } = useCourseSharedBy(props)

  const mainText = isSelf
    ? 'Course créée par vous'
    : sharerName
      ? `Partagée par ${sharerName}`
      : 'Partagée par un chauffeur du réseau'

  const scopeLabel = props.visibility === 'PUBLIC'
    ? 'Visible par tout le réseau'
    : props.visibility === 'GROUP' && groupNames.length > 0
      ? `Dans ${groupNames.join(', ')}`
      : null

  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-4 mb-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-warm-50 flex items-center justify-center shrink-0">
        <Share2 className="w-4 h-4 text-warm-600" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{mainText}</p>
        {scopeLabel && (
          <p className="text-[12px] text-warm-600 mt-0.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" strokeWidth={2} />
            {scopeLabel}
          </p>
        )}
      </div>
    </div>
  )
}
