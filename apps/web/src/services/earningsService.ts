import { createClient } from '@/lib/supabase/client'

export interface EarningsDay {
  date: string
  earnings: number
  count: number
}

export interface DailyEarningsStats {
  todayEarnings: number
  todayCount: number
  yesterdayEarnings: number
  weekSparkline: EarningsDay[]
}

function localDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const earningsService = {
  async getDailyStats(driverId: string, now: Date = new Date()): Promise<DailyEarningsStats> {
    const supabase = createClient()
    const todayStart = startOfLocalDay(now)
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const sevenDaysAgo = new Date(todayStart)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const { data, error } = await supabase
      .from('missions')
      .select('completed_at, price_eur')
      .eq('driver_id', driverId)
      .eq('status', 'COMPLETED')
      .gte('completed_at', sevenDaysAgo.toISOString())

    if (error) throw new Error(error.message)

    const buckets = new Map<string, EarningsDay>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      const key = localDayKey(d)
      buckets.set(key, { date: key, earnings: 0, count: 0 })
    }

    let todayEarnings = 0
    let todayCount = 0
    let yesterdayEarnings = 0

    for (const row of data ?? []) {
      if (!row.completed_at) continue
      const completed = new Date(row.completed_at)
      const price = row.price_eur != null ? Number(row.price_eur) : 0
      const key = localDayKey(completed)
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.earnings += price
        bucket.count += 1
      }
      if (completed >= todayStart) {
        todayEarnings += price
        todayCount += 1
      } else if (completed >= yesterdayStart) {
        yesterdayEarnings += price
      }
    }

    return {
      todayEarnings: Math.round(todayEarnings * 100) / 100,
      todayCount,
      yesterdayEarnings: Math.round(yesterdayEarnings * 100) / 100,
      weekSparkline: Array.from(buckets.values()),
    }
  },
}
