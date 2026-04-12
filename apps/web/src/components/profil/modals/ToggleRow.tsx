'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ToggleRowProps {
  label: string
  desc?: string
  defaultOn?: boolean
  value?: boolean
  onChange?: (value: boolean) => void
}

export function ToggleRow({ label, desc, defaultOn = true, value, onChange }: ToggleRowProps) {
  const [internal, setInternal] = useState(defaultOn)
  const on = value !== undefined ? value : internal

  function handleToggle() {
    if (onChange) {
      onChange(!on)
    } else {
      setInternal(!on)
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0">
      <div>
        <div className="text-sm font-semibold text-secondary">{label}</div>
        {desc && <div className="text-xs text-muted">{desc}</div>}
      </div>
      <button
        onClick={handleToggle}
        aria-label={`${on ? 'Désactiver' : 'Activer'} ${label}`}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${on ? 'bg-primary' : 'bg-line'}`}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-button"
          animate={{ left: on ? '24px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}
