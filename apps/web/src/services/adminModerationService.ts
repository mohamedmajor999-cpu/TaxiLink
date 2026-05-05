import { api } from '@/lib/api'

interface DeleteByEmailResult {
  ok: true
  deleted_email: string
  deleted_user_id: string
}

export const adminModerationService = {
  // Supprime un compte par email cote admin (anonymisation SQL puis auth.admin.deleteUser).
  // Voir /api/admin/users/delete-by-email pour le detail (RGPD art. 17 cote moderation).
  deleteUserByEmail(email: string): Promise<DeleteByEmailResult> {
    return api.post<DeleteByEmailResult>('/api/admin/users/delete-by-email', { email })
  },
}
