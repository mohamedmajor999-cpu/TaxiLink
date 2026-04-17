'use client'

import { useMemo, useState } from 'react'
import { missionService } from '@/services/missionService'
import { validateMission, type MissionInput } from '@/lib/validators'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import type { Mission } from '@/lib/supabase/types'

type MissionType = 'CPAM' | 'PRIVE'
type PaymentMethod = 'CPAM' | 'CASH' | 'CB'

function defaultTime(): string {
  const d = new Date(Date.now() + 30 * 60_000)
  const m = Math.ceil(d.getMinutes() / 15) * 15
  d.setMinutes(m % 60, 0, 0)
  if (m >= 60) d.setHours(d.getHours() + 1)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildScheduledAt(time: string, reference?: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!match) return null
  const [, hh, mm] = match
  const h = Number(hh), m = Number(mm)
  if (h > 23 || m > 59) return null
  const d = reference ? new Date(reference) : new Date()
  if (Number.isNaN(d.getTime())) return null
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function timeFromMission(m: Mission | undefined): string {
  if (!m) return defaultTime()
  const d = new Date(m.scheduled_at)
  if (Number.isNaN(d.getTime())) return defaultTime()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function initialType(m: Mission | undefined): MissionType {
  return m?.type === 'PRIVE' ? 'PRIVE' : 'CPAM'
}

export function usePartagerMissionModal(onClose: () => void, mission?: Mission) {
  const isEdit = Boolean(mission)
  const [type, setType] = useState<MissionType>(initialType(mission))
  const [payment, setPayment] = useState<PaymentMethod>('CPAM')
  const [visible, setVisible] = useState<Set<string>>(new Set(['taxi13']))
  const [departure, setDeparture] = useState(mission?.departure ?? '')
  const [destination, setDestination] = useState(mission?.destination ?? '')
  const [time, setTime] = useState(timeFromMission(mission))
  const [price, setPrice] = useState(mission?.price_eur != null ? String(mission.price_eur) : '')
  const [patientName, setPatientName] = useState(mission?.patient_name ?? '')
  const [phone, setPhone] = useState(mission?.phone ?? '')
  const [notes, setNotes] = useState(mission?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleVisible = (k: string) => {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k); else next.add(k)
      return next
    })
  }

  const canSubmit = useMemo(() => {
    if (saving) return false
    if (departure.trim().length < 5) return false
    if (destination.trim().length < 5) return false
    if (type === 'CPAM' && !patientName.trim()) return false
    return true
  }, [saving, departure, destination, type, patientName])

  const submit = async () => {
    setError(null)

    const scheduled_at = buildScheduledAt(time, mission?.scheduled_at)
    if (!scheduled_at) {
      setError("L'heure doit être au format HH:MM (ex : 15h30 → 15:30)")
      return
    }

    const priceNum = price.trim() ? Number(price.replace(',', '.')) : null
    if (price.trim() && (Number.isNaN(priceNum) || priceNum! < 0)) {
      setError('Le prix doit être un nombre positif')
      return
    }

    const notesMerged = isEdit
      ? (notes.trim() || null)
      : ([
          notes.trim(),
          `Paiement: ${payment}`,
          visible.size > 0 ? `Visible: ${Array.from(visible).join(', ')}` : null,
        ].filter(Boolean).join(' · ').slice(0, 500) || null)

    const payload: MissionInput = {
      type,
      departure: departure.trim(),
      destination: destination.trim(),
      price_eur: priceNum,
      patient_name: type === 'CPAM' ? patientName.trim() : null,
      phone: phone.trim() || null,
      notes: notesMerged,
      scheduled_at,
    }

    const clientErrors = validateMission(payload)
    if (clientErrors.length > 0) {
      setError(clientErrors[0].message)
      return
    }

    setSaving(true)
    try {
      if (isEdit && mission) {
        await missionService.update(mission.id, payload)
      } else {
        await missionService.create(payload)
      }
      const driverId = useDriverStore.getState().driver.id
      if (driverId) await useMissionStore.getState().load(driverId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? 'Erreur lors de la mise à jour' : 'Erreur lors de la publication')
    } finally {
      setSaving(false)
    }
  }

  return {
    isEdit,
    type, setType,
    payment, setPayment,
    visible, toggleVisible,
    departure, setDeparture,
    destination, setDestination,
    time, setTime,
    price, setPrice,
    patientName, setPatientName,
    phone, setPhone,
    notes, setNotes,
    saving, error, canSubmit,
    submit,
  }
}
