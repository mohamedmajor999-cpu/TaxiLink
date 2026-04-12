import { createClient } from '@/lib/supabase/client'
import type { Driver } from '@/lib/supabase/types'

export const driverService = {
  async getDriver(driverId: string): Promise<Driver | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single()
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
    const { error } = await supabase
      .from('drivers')
      .update({ is_online: isOnline })
      .eq('id', driverId)
    if (error) throw new Error(error.message)
  },
}
