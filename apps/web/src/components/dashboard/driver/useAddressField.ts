'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isGoogleMapsKeyConfigured,
  primeGoogleAutocompleteCache,
  resolveGooglePlace,
  searchGoogle,
  type AddressSuggestion,
} from '@/services/addressService'

const DEBOUNCE_MS = 350
const BLUR_CLOSE_MS = 150
const MIN_CHARS = 3

function newSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

interface UseAddressFieldArgs {
  value: string
  onChange: (value: string) => void
  onSelectSuggestion: (suggestion: AddressSuggestion) => void
}

const MISSING_KEY_MSG = 'Recherche d\'adresse indisponible : clé Google non configurée.'

export function useAddressField({ value, onChange, onSelectSuggestion }: UseAddressFieldArgs) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [apiError, setApiError] = useState<string | null>(isGoogleMapsKeyConfigured() ? null : MISSING_KEY_MSG)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blurRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Évite de relancer une recherche après sélection (value = label exact).
  const skipNextSearchRef = useRef(false)
  // Session Google Places : Autocomplete + Details groupés = facturation unique.
  const sessionTokenRef = useRef<string | null>(null)

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
    if (value.trim().length < MIN_CHARS) {
      setSuggestions([])
      setLoading(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      if (!sessionTokenRef.current) sessionTokenRef.current = newSessionToken()
      searchGoogle(value, ctrl.signal, null, sessionTokenRef.current)
        .then((res) => {
          if (ctrl.signal.aborted) return
          setSuggestions(res)
          setApiError(null)
        })
        .catch((err) => {
          if ((err as Error).name === 'AbortError') return
          setSuggestions([])
          setApiError((err as Error).message || 'Erreur réseau lors de la recherche.')
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

  const handleSelect = useCallback(async (s: AddressSuggestion) => {
    skipNextSearchRef.current = true
    onChange(s.label)
    setSuggestions([])
    setOpen(false)
    const token = sessionTokenRef.current ?? undefined
    if (s.placeId && (!s.lat || !s.lng)) {
      const details = await resolveGooglePlace(s.placeId, undefined, token).catch(() => null)
      sessionTokenRef.current = null
      if (details) {
        const enrichedLabel = details.formattedAddress && s.mainText
          ? `${s.mainText}, ${details.formattedAddress}`
          : details.formattedAddress ?? s.label
        const enriched = { ...s, label: enrichedLabel, lat: details.lat, lng: details.lng }
        primeGoogleAutocompleteCache(enrichedLabel, enriched)
        skipNextSearchRef.current = true
        onChange(enrichedLabel)
        onSelectSuggestion(enriched)
        return
      }
    } else {
      sessionTokenRef.current = null
    }
    onSelectSuggestion(s)
  }, [onChange, onSelectSuggestion])

  const handleFocus = useCallback(() => {
    if (blurRef.current) clearTimeout(blurRef.current)
    if (suggestions.length > 0) setOpen(true)
  }, [suggestions.length])

  const handleBlur = useCallback(() => {
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
    apiError,
    open: open && suggestions.length > 0,
    handleInput,
    handleSelect,
    handleFocus,
    handleBlur,
    handleKeyDown,
  }
}
