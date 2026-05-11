'use client'
import { useState } from 'react'
import type { ReasonOption } from './ReasonDialog'

// State du ReasonDialog : radio + textarea "autre" + soumission. Extrait du
// composant pour rester testable sans render JSX (identique aux anciens
// useCancelMissionDialog / useNoShowDialog avant factorisation).
export function useReasonDialog({
  reasons,
  submitting,
  onSubmit,
}: {
  reasons: ReadonlyArray<ReasonOption>
  submitting: boolean
  onSubmit: (reason: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')

  const label = reasons.find((r) => r.key === selected)?.label ?? ''
  const effective = selected === 'other' ? customText.trim() : label
  const canSubmit = !submitting && Boolean(effective)

  function handleConfirm() {
    if (effective) onSubmit(effective)
  }

  return { selected, setSelected, customText, setCustomText, effective, canSubmit, handleConfirm }
}
