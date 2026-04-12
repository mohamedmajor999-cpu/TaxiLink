'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useDriverStore } from '@/store/driverStore'
import { Icon } from '@/components/ui/Icon'

export function OnlineToggle() {
  const { driver, setOnline } = useDriverStore()
  const isOnline = driver.isOnline

  return (
    <motion.div
      className={`rounded-2xl p-4 flex items-center justify-between transition-colors duration-500 ${
        isOnline
          ? 'bg-secondary text-white'
          : 'bg-bgsoft border border-line text-secondary'
      }`}
      layout
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={`w-3 h-3 rounded-full status-pulse ${
              isOnline ? 'bg-green-400' : 'bg-muted'
            }`}
          />
        </div>
        <div>
          <div className={`text-sm font-bold ${isOnline ? 'text-white' : 'text-secondary'}`}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
          <div className={`text-xs ${isOnline ? 'text-white/60' : 'text-muted'}`}>
            {isOnline ? 'Vous recevez des missions' : 'Activez pour recevoir des missions'}
          </div>
        </div>
      </div>

      <button
        onClick={() => setOnline(!isOnline)}
        aria-label={isOnline ? 'Passer hors ligne' : 'Passer en ligne'}
        className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isOnline ? 'bg-green-400' : 'bg-line'
        }`}
      >
        <motion.div
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-button"
          animate={{ left: isOnline ? '28px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </motion.div>
  )
}
