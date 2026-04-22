'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

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

function fmtDate(d: Date) { return d.toISOString().slice(0, 10) }
function fmtNow() { return new Date().toTimeString().slice(0, 5) }

function emptyForm(date: Date): AddModalForm {
  return {
    date: fmtDate(date),
    time: fmtNow(),
    departure: '',
    destination: '',
    type: 'PRIVE',
    priceEur: '',
    patientName: '',
    notes: '',
  }
}

export function useAgendaAddModal(selectedDate: Date, onAdded: (m: Mission) => void) {
  const { user } = useAuth()
  const [form, setForm] = useState<AddModalForm>(() => emptyForm(selectedDate))
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
      const mission = await missionService.createManual(user.id, {
        departure: form.departure.trim(),
        destination: form.destination.trim(),
        scheduledAt,
        type: form.type,
        priceEur: form.priceEur ? Number(form.priceEur) : null,
        patientName: form.type === 'CPAM' ? form.patientName.trim() || null : null,
        notes: form.notes.trim() || null,
      })
      onAdded(mission)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, set, submit, submitting, error }
}
