'use client'

import { useMemo, useState } from 'react'
import { missionService } from '@/services/missionService'
import { validateMission, type MissionInput } from '@/lib/validators'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'

type MissionType = 'CPAM' | 'PRIVE'
type PaymentMethod = 'CPAM' | 'CASH' | 'CB'

function defaultTime(): string {
  const d = new Date(Date.now() + 30 * 60_000)
  const m = Math.ceil(d.getMinutes() / 15) * 15
  d.setMinutes(m % 60, 0, 0)
  if (m >= 60) d.setHours(d.getHours() + 1)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildScheduledAt(time: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!match) return null
  const [, hh, mm] = match
  const h = Number(hh), m = Number(mm)
  if (h > 23 || m > 59) return null
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function usePartagerMissionModal(onClose: () => void) {
  const [type, setType] = useState<MissionType>('CPAM')
  const [payment, setPayment] = useState<PaymentMethod>('CPAM')
  const [visible, setVisible] = useState<Set<string>>(new Set(['taxi13']))
  const [departure, setDeparture] = useState('')
  const [destination, setDestination] = useState('')
  const [time, setTime] = useState(defaultTime())
  const [price, setPrice] = useState('')
  const [patientName, setPatientName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
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

    const scheduled_at = buildScheduledAt(time)
    if (!scheduled_at) {
      setError("L'heure doit être au format HH:MM (ex : 15h30 → 15:30)")
      return
    }

    const priceNum = price.trim() ? Number(price.replace(',', '.')) : null
    if (price.trim() && (Number.isNaN(priceNum) || priceNum! < 0)) {
      setError('Le prix doit être un nombre positif')
      return
    }

    const notesMerged = [
      notes.trim(),
      `Paiement: ${payment}`,
      visible.size > 0 ? `Visible: ${Array.from(visible).join(', ')}` : null,
    ].filter(Boolean).join(' · ').slice(0, 500)

    const payload: MissionInput = {
      type,
      departure: departure.trim(),
      destination: destination.trim(),
      price_eur: priceNum,
      patient_name: type === 'CPAM' ? patientName.trim() : null,
      phone: phone.trim() || null,
      notes: notesMerged || null,
      scheduled_at,
    }

    const clientErrors = validateMission(payload)
    if (clientErrors.length > 0) {
      setError(clientErrors[0].message)
      return
    }

    setSaving(true)
    try {
      await missionService.create(payload)
      const driverId = useDriverStore.getState().driver.id
      if (driverId) await useMissionStore.getState().load(driverId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication')
    } finally {
      setSaving(false)
    }
  }

  return {
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
