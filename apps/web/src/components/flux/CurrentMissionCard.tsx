'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MissionTypeBadge } from '@/components/ui/Badge'
import { LiveCountdown } from '@/components/ui/CountdownCircle'
import { Icon } from '@/components/ui/Icon'
import { formatEur, formatKm } from '@/lib/utils'
import { useCurrentMissionActions } from './useCurrentMissionActions'

export function CurrentMissionCard() {
  const { currentMission, handleCall, handleSms, handleNavigate, completeMission } = useCurrentMissionActions()

  if (!currentMission) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="rounded-2xl border-2 border-primary bg-white shadow-card overflow-hidden mb-6"
      >
        {/* Header */}
        <div className="bg-primary/10 px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wide">
              Mission en cours
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MissionTypeBadge type={currentMission.type} />
            <LiveCountdown scheduledAt={currentMission.scheduledAt} />
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {currentMission.patientName && (
            <div className="text-sm font-semibold text-secondary mb-2">
              {currentMission.patientName}
            </div>
          )}

          {/* Route */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <div className="w-0.5 h-6 bg-line" />
              <div className="w-2 h-2 rounded-full bg-primary border-2 border-secondary" />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="text-xs font-semibold text-muted truncate">
                {currentMission.departure}
              </div>
              <div className="text-xs font-semibold text-secondary truncate">
                {currentMission.destination}
              </div>
            </div>
          </div>

          {/* Info chips */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 bg-bgsoft rounded-lg px-2.5 py-1.5">
              <Icon name="route" size={13} className="text-muted" />
              <span className="text-xs font-semibold text-secondary">
                {formatKm(currentMission.distanceKm)}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-bgsoft rounded-lg px-2.5 py-1.5">
              <Icon name="euro" size={13} className="text-muted" />
              <span className="text-xs font-semibold text-secondary">
                {formatEur(currentMission.priceEur)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-4 gap-2">
            <ActionBtn icon="call" label="Appeler" onClick={handleCall} variant="yellow" />
            <ActionBtn icon="sms" label="SMS" onClick={handleSms} variant="ghost" />
            <ActionBtn icon="navigation" label="Naviguer" onClick={handleNavigate} variant="ghost" />
            <ActionBtn
              icon="check_circle"
              label="Terminer"
              onClick={completeMission}
              variant="dark"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
  variant,
}: {
  icon: string
  label: string
  onClick: () => void
  variant: 'yellow' | 'ghost' | 'dark'
}) {
  const base = 'flex flex-col items-center justify-center gap-1 py-2 rounded-xl btn-ripple'
  const variants = {
    yellow: 'bg-primary text-secondary',
    ghost: 'bg-bgsoft border border-line text-secondary',
    dark: 'bg-secondary text-white',
  }
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`${base} ${variants[variant]}`}
    >
      <Icon name={icon} size={16} />
      <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  )
}
