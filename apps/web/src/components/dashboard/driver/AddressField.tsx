'use client'
import { Check, Loader2, MapPin } from 'lucide-react'
import type { AddressSuggestion } from '@/services/addressService'
import { useAddressField } from './useAddressField'

interface Props {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSelectSuggestion: (suggestion: AddressSuggestion) => void
  filled: boolean
}

export function AddressField({
  label, placeholder, value, onChange, onSelectSuggestion, filled,
}: Props) {
  const {
    suggestions, loading, open,
    handleInput, handleSelect, handleFocus, handleBlur, handleKeyDown,
  } = useAddressField({ value, onChange, onSelectSuggestion })

  return (
    <div className="rounded-2xl border border-warm-200 bg-paper mb-3 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-warm-500">{label}</span>
        {filled && (
          <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
            <Check className="w-3 h-3 text-ink" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className="relative">
        <input
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-10 px-3 pr-9 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[14px] text-ink transition-colors"
        />
        {loading && (
          <Loader2
            className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-warm-500 animate-spin"
            strokeWidth={2}
          />
        )}

        {open && (
          <ul
            role="listbox"
            className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-xl border border-warm-200 bg-paper shadow-lg"
          >
            {suggestions.map((s) => (
              <li key={`${s.label}-${s.lat}-${s.lng}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-warm-50 transition-colors"
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-warm-500 shrink-0" strokeWidth={1.8} />
                  <span className="text-[13px] text-ink leading-snug">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
