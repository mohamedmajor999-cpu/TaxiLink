'use client'
import { useState } from 'react'
import { useDriverStore } from '@/store/driverStore'
import { useAuth } from '@/hooks/useAuth'
import type { Mission } from '@/lib/supabase/types'
import { renderInvoiceHtml } from './invoiceTemplate'

function buildInvoiceNumber(driverId: string, year: number, quarter: number): string {
  const short = driverId.slice(0, 6).toUpperCase()
  return `TLN-${year}-Q${quarter}-${short}`
}

function missionsInQuarter(missions: Mission[], year: number, quarter: number): Mission[] {
  const startMonth = (quarter - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999)
  return missions.filter((m) => {
    const d = new Date(m.completed_at ?? m.scheduled_at)
    return d >= start && d <= end
  })
}

export function useInvoiceGenerator() {
  const driver = useDriverStore((s) => s.driver)
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)

  const generate = async (missions: Mission[], year: number, quarter: number) => {
    if (!driver?.id) return
    setGenerating(true)
    try {
      const filtered = missionsInQuarter(missions, year, quarter)
      const html = renderInvoiceHtml({
        driver: {
          name: driver.name || 'Chauffeur TaxiLink',
          email: user?.email ?? null,
          phone: driver.phone ?? null,
        },
        year,
        quarter,
        missions: filtered,
        invoiceNumber: buildInvoiceNumber(driver.id, year, quarter),
      })
      const win = window.open('', '_blank')
      if (!win) {
        alert("Veuillez autoriser les pop-ups pour générer la facture.")
        return
      }
      win.document.open()
      win.document.write(html)
      win.document.close()
    } finally {
      setGenerating(false)
    }
  }

  return { generate, generating }
}
