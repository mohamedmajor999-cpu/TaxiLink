'use client'
import { useEffect, useMemo, useState } from 'react'
import { missionCorrectionService, type CorrectionPatch } from '@/services/missionCorrectionService'
import { useMissionEditSheetStore } from '@/store/missionEditSheetStore'
import type { Mission } from '@/lib/supabase/types'

interface FormState {
  departure: string
  destination: string
  phone: string
  priceEur: string // string pour gérer un input vide
}

function fromMission(m: Mission): FormState {
  return {
    departure: m.departure ?? '',
    destination: m.destination ?? '',
    phone: m.phone ?? '',
    priceEur: m.price_eur != null ? String(m.price_eur) : '',
  }
}

function buildPatch(initial: FormState, current: FormState): CorrectionPatch {
  const patch: CorrectionPatch = {}
  if (current.departure !== initial.departure) patch.departure = current.departure.trim()
  if (current.destination !== initial.destination) patch.destination = current.destination.trim()
  if (current.phone !== initial.phone) {
    const t = current.phone.trim()
    patch.phone = t.length > 0 ? t : null
  }
  if (current.priceEur !== initial.priceEur) {
    const trimmed = current.priceEur.trim()
    if (trimmed === '') patch.price_eur = null
    else {
      const n = Number(trimmed.replace(',', '.'))
      patch.price_eur = Number.isFinite(n) ? n : null
    }
  }
  return patch
}

export function useMissionEditSheet(onSuccess?: (m: Mission) => void) {
  const mission = useMissionEditSheetStore((s) => s.mission)
  const mode = useMissionEditSheetStore((s) => s.mode)
  const close = useMissionEditSheetStore((s) => s.close)

  const initial = useMemo<FormState | null>(() => mission ? fromMission(mission) : null, [mission])
  const [form, setForm] = useState<FormState | null>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-sync form quand on ouvre une autre mission
  useEffect(() => {
    setForm(initial)
    setError(null)
  }, [initial])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  const dirty = useMemo(() => {
    if (!initial || !form) return false
    return Object.keys(buildPatch(initial, form)).length > 0
  }, [initial, form])

  const isPriceMode = mode === 'price'
  const editableFields = {
    address: !isPriceMode,
    phone: !isPriceMode,
    price: isPriceMode,
  }

  async function submit() {
    if (!mission || !initial || !form || !dirty) return
    setBusy(true)
    setError(null)
    try {
      const patch = buildPatch(initial, form)
      // En mode prix, ne pousser que price_eur — protège contre des modifs adresse
      // accidentelles qui seraient refusées par le serveur (status=DONE → 403 sur address).
      if (isPriceMode) {
        const cleaned: CorrectionPatch = {}
        if ('price_eur' in patch) cleaned.price_eur = patch.price_eur
        Object.assign(patch, {})
        const updated = await missionCorrectionService.correct(mission.id, cleaned)
        onSuccess?.(updated)
      } else {
        const cleaned: CorrectionPatch = { ...patch }
        delete cleaned.price_eur
        const updated = await missionCorrectionService.correct(mission.id, cleaned)
        onSuccess?.(updated)
      }
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setBusy(false)
    }
  }

  return {
    open: Boolean(mission && form),
    mission,
    mode,
    form,
    initial,
    setField,
    editableFields,
    dirty,
    busy,
    error,
    submit,
    close,
  }
}
