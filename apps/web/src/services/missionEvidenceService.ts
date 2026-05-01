import { createClient } from '@/lib/supabase/client'

// Service de gestion des preuves de transport CPAM (signature patient,
// photo bon de transport). Bucket prive `mission-evidence` — RGPD Article 9.
//
// Convention de path : `<missionId>/<filename>`. La RLS sur storage.objects
// (cf. 20260501_missions_evidence.sql) verifie que mission.driver_id = uid.
// Les chemins sont stockes dans missions.pickup_signature_url et
// missions.transport_voucher_url — pas d'URL publique, seulement le chemin
// brut. Pour l'affichage, on demande une signed URL a la volee.

const BUCKET = 'mission-evidence'
const MAX_VOUCHER_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_VOUCHER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const SIGNED_URL_TTL_SECONDS = 60 * 5

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

export const missionEvidenceService = {
  /**
   * Upload la signature du patient (PNG dataURL produit par le canvas) et
   * met a jour le chemin sur la mission.
   */
  async uploadSignature(missionId: string, dataUrl: string): Promise<string> {
    const supabase = createClient()
    const blob = await dataUrlToBlob(dataUrl)
    const path = `${missionId}/signature.png`
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'image/png', upsert: true })
    if (upErr) throw new Error(upErr.message)

    const { error: dbErr } = await supabase
      .from('missions')
      .update({ pickup_signature_url: path })
      .eq('id', missionId)
    if (dbErr) throw new Error(dbErr.message)
    return path
  },

  /** Upload la photo (ou le PDF) du bon de transport. */
  async uploadVoucher(missionId: string, file: File): Promise<string> {
    if (!ALLOWED_VOUCHER_TYPES.includes(file.type)) {
      throw new Error('Format non autorisé. Acceptés : JPG, PNG, WEBP, PDF.')
    }
    if (file.size > MAX_VOUCHER_SIZE_BYTES) {
      throw new Error('Fichier trop volumineux (max 8 Mo).')
    }
    const supabase = createClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const path = `${missionId}/voucher.${ext}`
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true })
    if (upErr) throw new Error(upErr.message)

    const { error: dbErr } = await supabase
      .from('missions')
      .update({ transport_voucher_url: path })
      .eq('id', missionId)
    if (dbErr) throw new Error(dbErr.message)
    return path
  },

  /** Renvoie une signed URL temporaire pour afficher une preuve. */
  async getSignedUrl(path: string): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
    if (error) throw new Error(error.message)
    return data.signedUrl
  },
}
