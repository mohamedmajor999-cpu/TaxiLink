'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { searchAddresses, type AddressSuggestion } from '@/services/addressService'

const DEBOUNCE_MS = 250
const BLUR_CLOSE_MS = 150

interface UseAddressFieldArgs {
  value: string
  onChange: (value: string) => void
  onSelectSuggestion: (suggestion: AddressSuggestion) => void
}

export function useAddressField({ value, onChange, onSelectSuggestion }: UseAddressFieldArgs) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blurRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Évite de relancer une recherche après une sélection (qui setValue à label exact).
  const skipNextSearchRef = useRef(false)

  // Cleanup global
  useEffect(() => () => {
    abortRef.current?.abort()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (blurRef.current) clearTimeout(blurRef.current)
  }, [])

  // Debounce sur la valeur courante
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 3) {
      setSuggestions([])
      setLoading(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      searchAddresses(value, ctrl.signal)
        .then((res) => {
          if (ctrl.signal.aborted) return
          setSuggestions(res)
        })
        .catch((err) => {
          if ((err as Error).name === 'AbortError') return
          setSuggestions([])
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false)
        })
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  const handleInput = useCallback((next: string) => {
    onChange(next)
    setOpen(true)
  }, [onChange])

  const handleSelect = useCallback((s: AddressSuggestion) => {
    skipNextSearchRef.current = true
    onChange(s.label)
    onSelectSuggestion(s)
    setSuggestions([])
    setOpen(false)
  }, [onChange, onSelectSuggestion])

  const handleFocus = useCallback(() => {
    if (blurRef.current) clearTimeout(blurRef.current)
    if (suggestions.length > 0) setOpen(true)
  }, [suggestions.length])

  const handleBlur = useCallback(() => {
    // Délai pour laisser passer le clic sur une suggestion
    if (blurRef.current) clearTimeout(blurRef.current)
    blurRef.current = setTimeout(() => setOpen(false), BLUR_CLOSE_MS)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && open && suggestions.length > 0) {
      e.preventDefault()
      handleSelect(suggestions[0])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [handleSelect, open, suggestions])

  return {
    suggestions,
    loading,
    open: open && suggestions.length > 0,
    handleInput,
    handleSelect,
    handleFocus,
    handleBlur,
    handleKeyDown,
  }
}
