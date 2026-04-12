'use client'

import { motion } from 'framer-motion'
import type { Mission } from '@taxilink/core'
import { MissionTypeBadge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { formatEur, formatKm, getMinutesUntil } from '@/lib/utils'
import { useMissionStore } from '@/store/missionStore'

interface MissionCardProps {
  mission: Mission
  index: number
}

export function MissionCard({ mission, index }: MissionCardProps) {
  const { acceptMission } = useMissionStore()
  const minutesUntil = getMinutesUntil(mission.scheduledAt)
  const isUrgent = minutesUntil <= 10

  const handleAccept = () => {
    // Optimistic UI — immediate
    acceptMission(mission.id)
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mission.phone) window.location.href = `tel:${mission.phone}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.05 }}
      className="mission-card bg-white rounded-2xl shadow-soft border border-line overflow-hidden"
    >
      {/* Top strip */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MissionTypeBadge type={mission.type} />
          {isUrgent && (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Urgent
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Icon name="schedule" size={13} className="text-muted" />
          <span
            className={`text-xs font-bold ${
              isUrgent ? 'text-red-500' : minutesUntil <= 20 ? 'text-orange-500' : 'text-muted'
            }`}
          >
            {minutesUntil === 0 ? 'Maintenant' : `Dans ${minutesUntil} min`}
          </span>
        </div>
      </div>

      {/* Route */}
      <div className="px-4 pb-2 flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <div className="w-0.5 h-5 bg-line" />
          <div className="w-2 h-2 rounded-full bg-primary border-2 border-secondary" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="text-xs font-semibold text-muted truncate leading-relaxed">
            {mission.departure}
          </div>
          <div className="text-xs font-semibold text-secondary truncate leading-relaxed">
            {mission.destination}
          </div>
        </div>
      </div>

      {/* Info row + actions */}
      <div className="px-4 pb-3 flex items-center justify-between gap-2">
        {/* Distance / Price */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Icon name="route" size={13} className="text-muted" />
            <span className="text-xs font-semibold text-secondary">
              {formatKm(mission.distanceKm)}
            </span>
          </div>
          <div className="w-1 h-1 rounded-full bg-line" />
          <div className="flex items-center gap-1">
            <Icon name="euro" size={13} className="text-muted" />
            <span className="text-sm font-black text-secondary">
              {formatEur(mission.priceEur)}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {mission.phone && (
            <button
              onClick={handleCall}
              aria-label="Appeler"
              className="w-9 h-9 rounded-xl bg-bgsoft border border-line flex items-center justify-center btn-ripple"
            >
              <Icon name="call" size={16} className="text-secondary" />
            </button>
          )}
          <button
            onClick={handleAccept}
            aria-label="Accepter la mission"
            className="h-9 px-4 rounded-xl bg-primary font-bold text-xs text-secondary btn-ripple flex items-center gap-1.5"
          >
            <Icon name="check" size={15} />
            Accepter
          </button>
        </div>
      </div>

      {/* Patient info if available */}
      {mission.patientName && (
        <div className="px-4 pb-3 border-t border-line pt-2">
          <div className="flex items-center gap-1.5">
            <Icon name="person" size={13} className="text-muted" />
            <span className="text-xs text-muted font-medium">{mission.patientName}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
