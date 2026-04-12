'use client'

import { useState, useEffect, useRef } from 'react'

type SimState = 'idle' | 'listening' | 'filling' | 'done'

export const FIELDS = [
  { key: 'depart',  label: 'Départ',  value: '15 Rue du Maréchal Foch' },
  { key: 'arrivee', label: 'Arrivée', value: 'Hôpital Lariboisière'    },
  { key: 'prix',    label: 'Prix',    value: '28 €'                     },
  { key: 'heure',   label: 'Heure',   value: '14:30'                    },
]

export function useProblemeSection() {
  const [state, setState] = useState<SimState>('idle')
  const [filledCount, setFilledCount] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function start() {
    if (timer.current) clearTimeout(timer.current)
    setFilledCount(0)
    setState('listening')
  }

  useEffect(() => {
    if (state === 'listening') {
      timer.current = setTimeout(() => setState('filling'), 900)
    }
    if (state === 'filling') {
      if (filledCount < FIELDS.length) {
        timer.current = setTimeout(() => setFilledCount((c) => c + 1), 500)
      } else {
        timer.current = setTimeout(() => setState('done'), 400)
      }
    }
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [state, filledCount])

  return { state, filledCount, fields: FIELDS, start }
}
