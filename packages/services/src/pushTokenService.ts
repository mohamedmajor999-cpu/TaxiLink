import { getSupabaseClient } from './lib/client'

export type PushPlatform = 'ios' | 'android'

export interface PushTokenUpsert {
  token: string
  platform: PushPlatform
  deviceName?: string | null
}

export const pushTokenService = {
  /**
   * Upsert le token push de l'appareil pour l'user courant. Idempotent : si
   * le token existe deja (UNIQUE), on bump juste last_seen_at et la platform.
   * Le lien token <-> user_id reste, donc un changement de compte sur le meme
   * appareil reassigne le token (auth.uid() different => upsert reecrit user_id).
   */
  async upsert(input: PushTokenUpsert): Promise<void> {
    const supabase = getSupabaseClient()
    const { data: u, error: uErr } = await supabase.auth.getUser()
    if (uErr || !u.user?.id) throw new Error(uErr?.message ?? 'Not authenticated')

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: u.user.id,
          token: input.token,
          platform: input.platform,
          device_name: input.deviceName ?? null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'token' },
      )
    if (error) throw new Error(error.message)
  },

  /** Supprime le token courant (logout / desactivation des notifs). */
  async remove(token: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('push_tokens').delete().eq('token', token)
    if (error) throw new Error(error.message)
  },
}
