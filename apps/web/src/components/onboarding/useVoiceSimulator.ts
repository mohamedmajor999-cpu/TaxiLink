import { useState } from 'react'

type SimState = 'idle' | 'listening' | 'filling' | 'done'

const SIM_FIELDS_COUNT = 4

export function useVoiceSimulator() {
  const [state, setState] = useState<SimState>('idle')
  const [filled, setFilled] = useState(0)

  const run = () => {
    if (state !== 'idle') return
    setState('listening')
    setTimeout(() => {
      setState('filling')
      let i = 0
      const tick = () => {
        i++
        setFilled(i)
        if (i < SIM_FIELDS_COUNT) setTimeout(tick, 600)
        else setState('done')
      }
      setTimeout(tick, 400)
    }, 1400)
  }

  const reset = () => { setState('idle'); setFilled(0) }

  return { state, filled, run, reset }
}
