'use client'

import { Icon } from '@/components/ui/Icon'

type RouteField = 'departure' | 'destination' | 'distance' | 'duration' | 'price'

type RouteInputsProps = {
  departure: string
  destination: string
  distance: string
  duration: string
  price: string
  onChange: (field: RouteField, value: string) => void
  onCalculate: () => void
}

export function RouteInputs({
  departure,
  destination,
  distance,
  duration,
  price,
  onChange,
  onCalculate,
}: RouteInputsProps) {
  return (
    <div>
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-secondary flex items-center justify-center z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <input
            type="text"
            value={departure}
            onChange={(e) => onChange('departure', e.target.value)}
            placeholder="Adresse de départ"
            required
            className="w-full h-14 pl-12 pr-4 rounded-xl bg-white border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-all"
          />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
              <path
                d="M6 0C2.69 0 0 2.69 0 6C0 9.75 6 16 6 16C6 16 12 9.75 12 6C12 2.69 9.31 0 6 0ZM6 8.25C4.76 8.25 3.75 7.24 3.75 6C3.75 4.76 4.76 3.75 6 3.75C7.24 3.75 8.25 4.76 8.25 6C8.25 7.24 7.24 8.25 6 8.25Z"
                fill="#1a1a1a"
              />
            </svg>
          </div>
          <input
            type="text"
            value={destination}
            onChange={(e) => onChange('destination', e.target.value)}
            placeholder="Adresse d'arrivée"
            required
            className="w-full h-14 pl-12 pr-4 rounded-xl bg-white border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-all"
          />
        </div>

        <button
          type="button"
          onClick={onCalculate}
          className="w-full h-12 rounded-xl bg-accent/10 border-2 border-accent/30 text-accent font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent/20 transition-all btn-ripple"
        >
          <Icon name="route" size={18} className="text-accent" />
          Calculer la distance et le prix
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5 pb-6">
        {[
          { field: 'distance' as const, value: distance, placeholder: '15', unit: 'km' },
          { field: 'duration' as const, value: duration, placeholder: '25', unit: 'min' },
          { field: 'price' as const, value: price, placeholder: '38.50', unit: '€' },
        ].map(({ field, value, placeholder, unit }) => (
          <div key={field} className="relative">
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={placeholder}
              required
              className="w-full h-14 px-3 rounded-xl bg-white border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold transition-all text-center"
            />
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-5 text-[10px] font-semibold text-muted uppercase tracking-wide">
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
