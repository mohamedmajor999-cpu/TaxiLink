'use client'
import { useState } from 'react'

export const CANCEL_REASONS = [
  { key: 'delay', label: 'Retard important' },
  { key: 'vehicle', label: 'Véhicule immobilisé' },
  { key: 'personal', label: 'Urgence personnelle' },
  { key: 'address', label: 'Adresse introuvable' },
  { key: 'other', label: 'Autre' },
] as const

export function useCancelMissionDialog({
  submitting,
  onSubmit,
}: {
  submitting: boolean
  onSubmit: (reason: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')

  const label = CANCEL_REASONS.find((r) => r.key === selected)?.label ?? ''
  const effective = selected === 'other' ? customText.trim() : label
  const canSubmit = !submitting && Boolean(effective)

  function handleConfirm() {
    if (effective) onSubmit(effective)
  }

  return { selected, setSelected, customText, setCustomText, effective, canSubmit, handleConfirm }
}
