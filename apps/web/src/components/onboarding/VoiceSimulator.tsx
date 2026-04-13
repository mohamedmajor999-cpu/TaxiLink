'use client'

import { Icon } from '@/components/ui/Icon'
import { useVoiceSimulator } from './useVoiceSimulator'

const SIM_FIELDS = [
  { label: 'Départ',  value: '12 rue de la Paix, Paris' },
  { label: 'Arrivée', value: 'Hôpital Lariboisière' },
  { label: 'Prix',    value: '28 €' },
  { label: 'Heure',   value: '09h30' },
]

export function VoiceSimulator() {
  const { state, filled, run, reset } = useVoiceSimulator()

  return (
    <div className="glass rounded-2xl p-6 mt-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={state === 'done' ? reset : run}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg flex-shrink-0 ${
            state === 'listening' ? 'bg-red-500 animate-pulse' :
            state === 'done'     ? 'bg-green-500' : 'bg-primary'
          }`}
        >
          <Icon name={state === 'done' ? 'replay' : 'mic'} size={24} className="text-secondary" />
        </button>
        <div>
          <p className="font-bold text-white text-sm">
            {state === 'idle'      && 'Appuyez et parlez'}
            {state === 'listening' && 'Écoute en cours…'}
            {state === 'filling'   && 'Remplissage automatique…'}
            {state === 'done'      && 'Recommencer'}
          </p>
          <p className="text-white/40 text-xs mt-0.5">Simulation IA vocale TaxiLink</p>
        </div>
      </div>

      <div className="space-y-3">
        {SIM_FIELDS.map((f, i) => (
          <div key={f.label} className="flex items-center gap-3">
            <span className="text-white/40 text-xs font-bold w-14 flex-shrink-0">{f.label}</span>
            <div className={`flex-1 h-10 rounded-xl px-3 flex items-center text-sm font-semibold transition-all duration-300 ${
              filled > i
                ? 'bg-primary/20 border border-primary/40 text-primary'
                : 'bg-white/5 border border-white/10 text-transparent'
            }`}>
              {filled > i ? f.value : '—'}
            </div>
          </div>
        ))}
      </div>

      {state === 'done' && (
        <div className="mt-5 flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-3">
          <Icon name="check_circle" size={18} className="text-green-400" />
          <span className="text-green-300 font-bold text-sm">Posté en 30 secondes</span>
        </div>
      )}
    </div>
  )
}
