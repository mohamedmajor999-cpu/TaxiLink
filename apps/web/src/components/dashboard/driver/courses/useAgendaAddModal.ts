'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'
import { toIsoLocalDate } from './agendaHelpers'

export type ManualType = 'CPAM' | 'PRIVE' | 'TAXILINK'

export interface AddModalForm {
  date: string
  time: string
  departure: string
  destination: string
  type: ManualType
  priceEur: string
  patientName: string
  notes: string
}

function fmtTime(d: Date) { return d.toTimeString().slice(0, 5) }
function fmtNow() { return new Date().toTimeString().slice(0, 5) }

function emptyForm(date: Date): AddModalForm {
  return {
    date: toIsoLocalDate(date),
    time: fmtNow(),
    departure: '',
    destination: '',
    type: 'PRIVE',
    priceEur: '',
    patientName: '',
    notes: '',
  }
}

function fromMission(m: Mission): AddModalForm {
  const d = new Date(m.scheduled_at)
  return {
    date: toIsoLocalDate(d),
    time: fmtTime(d),
    departure: m.departure ?? '',
    destination: m.destination ?? '',
    type: (['CPAM', 'PRIVE', 'TAXILINK'].includes(m.type) ? m.type : 'PRIVE') as ManualType,
    priceEur: m.price_eur != null ? String(m.price_eur) : '',
    patientName: m.patient_name ?? '',
    notes: m.notes ?? '',
  }
}

export function useAgendaAddModal(
  selectedDate: Date,
  onSaved: (m: Mission) => void,
  mission: Mission | null = null,
) {
  const { user } = useAuth()
  const isEdit = mission !== null
  const [form, setForm] = useState<AddModalForm>(() =>
    mission ? fromMission(mission) : emptyForm(selectedDate),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof AddModalForm>(k: K, v: AddModalForm[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit() {
    if (!user) return
    if (!form.departure.trim() || !form.destination.trim()) {
      setError("Le départ et l'arrivée sont requis.")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString()
      const payload = {
        departure: form.departure.trim(),
        destination: form.destination.trim(),
        scheduledAt,
        type: form.type,
        priceEur: form.priceEur ? Number(form.priceEur) : null,
        patientName: form.type === 'CPAM' ? form.patientName.trim() || null : null,
        notes: form.notes.trim() || null,
      }
      const saved = isEdit && mission
        ? await missionService.updateManual(mission.id, payload)
        : await missionService.createManual(user.id, payload)
      onSaved(saved)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, set, submit, submitting, error, isEdit }
}
