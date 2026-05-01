'use client'
import { useState } from 'react'

export const NO_SHOW_REASONS = [
  { key: 'absent', label: 'Patient absent au point de RDV' },
  { key: 'refused', label: 'Patient refuse de monter' },
  { key: 'wrong_address', label: 'Adresse introuvable / erronée' },
  { key: 'other_taxi', label: 'Patient déjà parti (autre taxi)' },
  { key: 'other', label: 'Autre' },
] as const

export function useNoShowDialog({
  submitting,
  onSubmit,
}: {
  submitting: boolean
  onSubmit: (reason: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')

  const label = NO_SHOW_REASONS.find((r) => r.key === selected)?.label ?? ''
  const effective = selected === 'other' ? customText.trim() : label
  const canSubmit = !submitting && Boolean(effective)

  function handleConfirm() {
    if (effective) onSubmit(effective)
  }

  return { selected, setSelected, customText, setCustomText, effective, canSubmit, handleConfirm }
}
