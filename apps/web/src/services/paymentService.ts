import { createClient } from '@/lib/supabase/client'
import type { Payment } from '@/lib/supabase/types'

export const paymentService = {
  async getPayments(driverId: string): Promise<Payment[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async updateIBAN(driverId: string, iban: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('payments')
      .update({ iban })
      .eq('driver_id', driverId)
      .eq('status', 'pending')
    if (error) throw new Error(error.message)
  },
}
