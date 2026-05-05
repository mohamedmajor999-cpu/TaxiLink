import { api } from '@/lib/api'

interface DeleteAccountResult {
  ok: true
  anonymized: true
  deleted: true
}

export const userRgpdService = {
  // Export RGPD art. 20 (droit a la portabilite). Le serveur stream un Blob
  // JSON dont la taille depend du volume de missions du user — on garde un
  // raw fetch ici car api.* deserialise systematiquement en JSON. Encapsule
  // dans le service pour que les hooks/composants n'appellent jamais fetch().
  async exportData(): Promise<Blob> {
    const res = await fetch('/api/users/export', { credentials: 'same-origin' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? `Erreur ${res.status}`)
    }
    return res.blob()
  },

  // RGPD art. 17 (droit a l'effacement) : anonymise puis supprime auth.users.
  // Voir /api/users/delete pour le detail.
  deleteAccount(): Promise<DeleteAccountResult> {
    return api.post<DeleteAccountResult>('/api/users/delete', {})
  },
}
