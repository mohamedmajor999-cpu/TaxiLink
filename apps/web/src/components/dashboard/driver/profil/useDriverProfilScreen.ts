'use client'
import { useEffect, useMemo, useState } from 'react'
import { useDriverStore } from '@/store/driverStore'
import { useAuth } from '@/hooks/useAuth'
import { driverService } from '@/services/driverService'
import { documentService } from '@/services/documentService'
import { missionService } from '@/services/missionService'
import { useDeptPreferences } from '@/hooks/useDeptPreferences'
import { useDriverStats } from '../useDriverStats'
import type { Document, Mission } from '@/lib/supabase/types'
import { computeStatus, MANDATORY_DOCS } from './documentStatus'

const DEPT_TO_CITY: Record<string, string> = {
  '13': 'Marseille',
  '75': 'Paris',
  '69': 'Lyon',
  '31': 'Toulouse',
  '06': 'Nice',
  '33': 'Bordeaux',
  '44': 'Nantes',
  '67': 'Strasbourg',
  '34': 'Montpellier',
  '59': 'Lille',
  '35': 'Rennes',
}

export function useDriverProfilScreen(driverName: string) {
  const { driver } = useDriverStore()
  const { user } = useAuth()
  const { missions } = useDriverStats()
  const { depts } = useDeptPreferences()
  const [proNumber, setProNumber] = useState<string | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [activeMissions, setActiveMissions] = useState<Mission[]>([])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    Promise.all([
      driverService.getDriver(user.id),
      documentService.getDocuments(user.id),
      missionService.getAgenda(user.id),
    ])
      .then(([d, docList, agenda]) => {
        if (cancelled) return
        if (d) setProNumber(d.pro_number)
        setDocs(docList)
        setActiveMissions(agenda.filter((m) => m.status === 'ACCEPTED' || m.status === 'IN_PROGRESS'))
      })
      .catch(() => { /* silencieux : valeurs par défaut */ })
    return () => { cancelled = true }
  }, [user])

  const initials = useMemo(() => {
    return driverName.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'YB'
  }, [driverName])

  const monthly = useMemo(() => {
    const now = new Date()
    const inMonth = [...missions, ...activeMissions].filter((m) => {
      const d = new Date(m.completed_at ?? m.scheduled_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    return {
      revenue: inMonth.reduce((s, m) => s + Number(m.price_eur ?? 0), 0),
      count: inMonth.length,
    }
  }, [missions, activeMissions])

  const documentsWarning = useMemo(() => {
    const byType = new Map(docs.map((d) => [d.type, d]))
    const toRenew = MANDATORY_DOCS.filter((slot) => {
      const status = computeStatus(byType.get(slot.type) ?? null)
      return status === 'expiring' || status === 'expired' || status === 'missing' || status === 'invalid'
    }).length
    if (toRenew === 0) return null
    return `${toRenew} document${toRenew > 1 ? 's' : ''} à renouveler`
  }, [docs])

  const mainDept = depts[0] ?? null
  const city = mainDept ? (DEPT_TO_CITY[mainDept] ?? null) : null

  return {
    fullName: driverName || 'Chauffeur',
    email: driver.email ?? user?.email ?? '',
    phone: driver.phone ?? '',
    initials,
    proNumber,
    courseCount: monthly.count,
    monthlyRevenue: monthly.revenue,
    documentsWarning,
    departements: depts,
    city,
    mainDepartement: mainDept,
  }
}
