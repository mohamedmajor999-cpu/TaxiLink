'use client'
import { Sun, Moon, SunMoon } from 'lucide-react'
import type { NightModePref } from '@/store/nightModeStore'

interface Props {
  pref: NightModePref
  onChange: (p: NightModePref) => void
}

// 'auto' a ete retire : la bascule horaire pretait a confusion. Choix manuel
// uniquement, defaut clair.
const OPTIONS: { value: NightModePref; label: string; Icon: typeof Sun }[] = [
  { value: 'off', label: 'Clair', Icon: Sun },
  { value: 'on', label: 'Sombre', Icon: Moon },
]

export function ThemeModeRow({ pref, onChange }: Props) {
  // Retro-compat : un user qui avait 'auto' persiste tombe sur "Clair" visuellement.
  const effectivePref: NightModePref = pref === 'auto' ? 'off' : pref
  return (
    <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border bg-paper border-warm-200 text-ink">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-warm-100 text-warm-800">
        <span className="w-[18px] h-[18px] grid place-items-center">
          <SunMoon className="w-full h-full" strokeWidth={1.8} />
        </span>
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold leading-tight">Apparence</div>
        <div className="text-[12px] text-warm-500 mt-0.5 truncate">
          Choix manuel · clair par défaut
        </div>
      </div>
      <div role="radiogroup" aria-label="Mode d'affichage" className="flex items-center gap-1 p-1 rounded-xl bg-warm-100">
        {OPTIONS.map(({ value, label, Icon }) => {
          const selected = effectivePref === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              onClick={() => onChange(value)}
              className={`h-7 px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                selected ? 'bg-paper text-ink shadow-subtle' : 'text-warm-600 hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
