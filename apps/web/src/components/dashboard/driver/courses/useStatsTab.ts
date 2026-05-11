'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'
import { fareValue } from './historyHelpers'

export type StatsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom'

const PERIOD_DAYS: Record<Exclude<StatsPeriod, 'custom'>, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
}

const MAX_HISTORY_DAYS = 365 // Plafond export : on n'autorise pas + d'1 an

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

// Parse YYYY-MM-DD en composantes LOCALES (pas via new Date(s) qui retombe
// en UTC midnight et decale d'1-2h en metropole, d'1 jour aux DROM-COM).
function parseYmdLocal(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function useStatsTab() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<StatsPeriod>('month')

  // Bornes par défaut : du = aujourd'hui − 30 j ; au = aujourd'hui.
  const today = useMemo(() => startOfDay(new Date()), [])
  const minDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - MAX_HISTORY_DAYS)
    return d
  }, [today])

  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - 30)
    return ymd(d)
  })
  const [customTo, setCustomTo] = useState(() => ymd(today))

  useEffect(() => {
    if (!user) return
    // Limit 5000 — couvre 1 an de courses pour un chauffeur a temps plein
    // (15 courses/j × 250 j ≈ 3750). Au-dela, on plafonne en silence.
    missionService
      .getDoneByDriver(user.id, 5000)
      .then(setMissions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [user])

  // Plage active selon la periode choisie. Custom : on borne aux 365 jours
  // max et on swap si l'utilisateur a inverse les dates.
  const range = useMemo(() => {
    if (period === 'custom') {
      let from = parseYmdLocal(customFrom)
      let to = parseYmdLocal(customTo)
      if (from > to) [from, to] = [to, from]
      if (from < minDate) from = new Date(minDate)
      to.setHours(23, 59, 59, 999)
      return { from, to }
    }
    const days = PERIOD_DAYS[period]
    const from = new Date(today)
    from.setDate(from.getDate() - days)
    const to = new Date(today)
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }, [period, customFrom, customTo, today, minDate])

  const filtered = useMemo(() => {
    const fromMs = range.from.getTime()
    const toMs = range.to.getTime()
    return missions.filter((m) => {
      const t = new Date(m.completed_at ?? m.scheduled_at).getTime()
      return t >= fromMs && t <= toMs
    })
  }, [missions, range])

  const kpi = useMemo(() => {
    const total = filtered.reduce((s, m) => s + fareValue(m), 0)
    const count = filtered.length
    const avg = count > 0 ? total / count : 0
    const cpamCount = filtered.filter((m) => m.type === 'CPAM').length
    const cpamRatio = count > 0 ? Math.round((cpamCount / count) * 100) : 0
    const km = filtered.reduce((s, m) => s + Number(m.distance_km ?? 0), 0)
    return { total, count, avgPerRide: avg, cpamRatioPct: cpamRatio, km }
  }, [filtered])

  const handleExport = useCallback(() => {
    if (filtered.length === 0 || typeof window === 'undefined') return
    exportToExcel(filtered, range.from, range.to)
  }, [filtered, range])

  return {
    loading, error,
    missions, filtered, kpi,
    period, setPeriod,
    customFrom, setCustomFrom, customTo, setCustomTo,
    minDate: ymd(minDate), maxDate: ymd(today),
    range, handleExport,
  }
}

function exportToExcel(missions: Mission[], from: Date, to: Date) {
  // CSV UTF-8 BOM pour qu'Excel detecte l'encodage tout seul.
  const header = ['Date', 'Heure', 'Type', 'Patient', 'Depart', 'Arrivee', 'Distance (km)', 'Duree (min)', 'Prix (€)', 'Statut']
  const rows = missions.map((m) => {
    const d = new Date(m.completed_at ?? m.scheduled_at)
    return [
      d.toLocaleDateString('fr-FR'),
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      m.type ?? '',
      m.patient_name ?? '',
      m.departure,
      m.destination,
      String(m.distance_km ?? ''),
      String(m.duration_min ?? ''),
      String(fareValue(m)),
      m.no_show ? 'Patient absent' : 'Effectuee',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')
  })
  const csv = '﻿' + [header.join(';'), ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `historique-${ymd(from)}-au-${ymd(to)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
