'use client'
import { useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { missionEvidenceService } from '@/services/missionEvidenceService'

// Gere l'upload des preuves CPAM (signature + bon de transport) pour une
// mission donnee. Met a jour la mission locale apres succes via
// `onLocalUpdate` pour que l'UI refleche immediatement le statut "✓ saved"
// sans avoir a refetch la mission.

export function useMissionEvidence(
  mission: Mission | null,
  onLocalUpdate: (next: Mission) => void,
) {
  const [signatureOpen, setSignatureOpen] = useState(false)
  const [uploading, setUploading] = useState<'signature' | 'voucher' | null>(null)

  const submitSignature = async (dataUrl: string) => {
    if (!mission) return
    setUploading('signature')
    try {
      const path = await missionEvidenceService.uploadSignature(mission.id, dataUrl)
      onLocalUpdate({ ...mission, pickup_signature_url: path })
      setSignatureOpen(false)
    } finally {
      setUploading(null)
    }
  }

  const submitVoucher = async (file: File) => {
    if (!mission) return
    setUploading('voucher')
    try {
      const path = await missionEvidenceService.uploadVoucher(mission.id, file)
      onLocalUpdate({ ...mission, transport_voucher_url: path })
    } finally {
      setUploading(null)
    }
  }

  return {
    signatureOpen,
    openSignature: () => setSignatureOpen(true),
    closeSignature: () => setSignatureOpen(false),
    submitSignature,
    submitVoucher,
    uploading,
    signatureSaved: !!mission?.pickup_signature_url,
    voucherSaved: !!mission?.transport_voucher_url,
  }
}
