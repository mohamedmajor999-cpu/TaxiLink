import { createClient } from '@/lib/supabase/client'
import type { Driver } from '@/lib/supabase/types'

export const driverService = {
  async getDriver(driverId: string): Promise<Driver | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async updateDriver(
    driverId: string,
    updates: Pick<Driver, 'vehicle_model' | 'vehicle_plate' | 'cpam_enabled'>
  ): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId)
    if (error) throw new Error(error.message)
  },

  async setOnline(driverId: string, isOnline: boolean): Promise<void> {
    const supabase = createClient()
    // Quand on passe en ligne, on seed `last_seen_at` immediatement pour eviter
    // qu'un timing entre la bascule et le premier heartbeat ne fasse apparaitre
    // le chauffeur "offline" pendant 60s.
    const update = isOnline
      ? { is_online: true, last_seen_at: new Date().toISOString() }
      : { is_online: false }
    const { error } = await supabase
      .from('drivers')
      .update(update)
      .eq('id', driverId)
    if (error) throw new Error(error.message)
  },

  async heartbeat(driverId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('drivers')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', driverId)
    if (error) throw new Error(error.message)
  },
}
