import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/lib/supabase/types'

export const documentService = {
  async getDocuments(driverId: string): Promise<Document[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async uploadFile(userId: string, type: string, file: File): Promise<string> {
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG.')
    }
    const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Fichier trop volumineux. Taille maximale : 10 Mo.')
    }
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${type}_${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('driver-documents')
      .upload(path, file, { upsert: true })
    if (error) throw new Error(error.message)
    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(path)
    return publicUrl
  },

  async upsertDocument(params: {
    existingId?: string
    driverId: string
    type: string
    label: string
    fileUrl: string
  }): Promise<void> {
    const supabase = createClient()
    if (params.existingId) {
      const { error } = await supabase
        .from('driver_documents')
        .update({ status: 'pending', file_url: params.fileUrl })
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
          file_url: params.fileUrl,
        })
      if (error) throw new Error(error.message)
    }
  },
}
