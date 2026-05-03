'use client'
import { Loader2 } from 'lucide-react'
import { Icon } from '@/components/ui/Icon'
import type { AddressSuggestion } from '@/services/addressService'
import { useAddressField } from '@/components/dashboard/driver/useAddressField'
import { useAddressFieldVoice } from '@/components/dashboard/driver/useAddressFieldVoice'

interface Props {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  onSelectSuggestion: (s: AddressSuggestion) => void
}

export function AddressLineInput({ label, placeholder, value, onChange, onSelectSuggestion }: Props) {
  const {
    suggestions, loading, open, apiError,
    handleInput, handleSelect, handleFocus, handleBlur, handleKeyDown,
  } = useAddressField({ value, onChange, onSelectSuggestion })

  const voice = useAddressFieldVoice({
    onResolved: (s) => { onChange(s.label); onSelectSuggestion(s) },
    onFallbackText: (text) => onChange(text),
  })

  const handleMicClick = () => {
    if (voice.isListening) voice.stop()
    else { onChange(''); voice.start() }
  }

  const busy = loading || voice.isProcessing

  return (
    <div className="relative w-full">
      <div className="text-[11px] font-bold tracking-[0.04em] uppercase text-warm-400 mb-0.5">{label}</div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[16px] font-bold tracking-[-0.012em] text-ink placeholder:text-warm-400 placeholder:font-semibold"
        />
        {busy && <Loader2 className="w-4 h-4 text-warm-500 animate-spin shrink-0" strokeWidth={2} />}
        {voice.isSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={voice.isProcessing}
            aria-label={voice.isListening ? 'Arrêter la dictée' : `Dicter ${label.toLowerCase()}`}
            onMouseDown={(e) => e.preventDefault()}
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              voice.isListening ? 'bg-brand text-ink' : 'bg-warm-100 text-ink hover:bg-brand'
            }`}
          >
            {voice.isListening && <span className="absolute inset-0 rounded-full bg-brand/40 animate-ping" />}
            <Icon name="mic" size={18} className="relative" />
          </button>
        )}
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 left-0 right-0 top-full mt-1 max-h-72 overflow-auto rounded-xl border border-warm-200 bg-paper shadow-lg"
        >
          {suggestions.map((s) => (
            <li key={`${s.label}-${s.lat}-${s.lng}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-warm-50 transition-colors"
              >
                <Icon name="location_on" size={16} className="mt-0.5 text-warm-500 shrink-0" />
                <span className="text-[13px] text-ink leading-snug">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {voice.error && <p className="mt-1 text-[11.5px] text-danger">{voice.error}</p>}
      {apiError && !voice.error && <p className="mt-1 text-[11.5px] text-danger">{apiError}</p>}
    </div>
  )
}
