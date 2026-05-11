import { getSupabaseClient } from './lib/client'
import type { Document } from '@taxilink/supabase-types'

export const documentService = {
  async getDocuments(driverId: string): Promise<Document[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  // Le bucket `driver-documents` est PRIVE (cf. migration
  // 20260510_driver_documents_bucket.sql). On retourne le `path` interne au
  // bucket, qu'on stocke en BD via upsertDocument. La lecture passe par
  // createSignedUrl (cote driver) ou par le service-role (cote admin).
  async uploadFile(userId: string, type: string, file: File, previousPath?: string | null): Promise<string> {
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG.')
    }
    const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Fichier trop volumineux. Taille maximale : 10 Mo.')
    }
    const supabase = getSupabaseClient()
    const ext = (file.name.split('.').pop() ?? '').toLowerCase() || 'bin'
    // Path deterministe (${userId}/${type}.${ext}) : `upsert: true` ecrase
    // ainsi l'ancien fichier de meme type+extension. Avant on incluait
    // Date.now() dans le path -> chaque re-upload creait un NOUVEAU fichier
    // et l'ancien restait orphelin dans le bucket (storage leak).
    // Si l'extension change (ex: pdf -> jpg), on supprime explicitement
    // l'ancien path qui ne sera pas ecrase par l'upsert.
    const path = `${userId}/${type}.${ext}`
    if (previousPath && previousPath !== path) {
      await supabase.storage.from('driver-documents').remove([previousPath]).catch(() => { /* tolerant : si l'ancien n'existe plus, pas grave */ })
    }
    const { error } = await supabase.storage
      .from('driver-documents')
      .upload(path, file, { upsert: true })
    if (error) throw new Error(error.message)
    return path
  },

  async getSignedUrl(path: string, expiresInSec = 60): Promise<string> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .createSignedUrl(path, expiresInSec)
    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  // `filePath` = chemin interne au bucket privé (cf. uploadFile). On le
  // stocke dans la colonne `file_url` pour eviter une migration de schema ;
  // sa lecture passe par getSignedUrl().
  async upsertDocument(params: {
    existingId?: string
    driverId: string
    type: string
    label: string
    filePath: string
  }): Promise<void> {
    const supabase = getSupabaseClient()
    if (params.existingId) {
      const { error } = await supabase
        .from('driver_documents')
        .update({ status: 'pending', file_url: params.filePath })
        .eq('id', params.existingId)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase
        .from('driver_documents')
        .insert({
          driver_id: params.driverId,
          type: params.type,
          label: params.label,
          status: 'pending',
          file_url: params.filePath,
        })
      if (error) throw new Error(error.message)
    }
  },
}
