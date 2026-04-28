'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { groupService } from '@/services/groupService'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import { usePublishedFeedbackStore } from '@/store/publishedFeedbackStore'
import type { Group } from '@taxilink/core'
import type { AddressSuggestion } from '@/services/addressService'
import {
  buildScheduledAt, defaultDate, defaultTime,
} from '@/components/dashboard/driver/missionFormHelpers'
import { useMissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import { useMissionRoute } from '@/components/dashboard/driver/useMissionRoute'
import { useMissionPricing } from '@/components/dashboard/driver/useMissionPricing'
import { useMissionVoiceFiller } from '@/components/dashboard/driver/useMissionVoiceFiller'
import { submitMission } from '@/components/dashboard/driver/submitMission'

export type WhenMode = 'now' | 'later'

export function usePosterCourse() {
  const router = useRouter()
  const driverId = useDriverStore((s) => s.driver.id)
  const form = useMissionFormState(undefined)
  const publishFeedback = usePublishedFeedbackStore((s) => s.publish)

  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [when, setWhen] = useState<WhenMode>('now')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // En CPAM, seed les valeurs requises au calcul tarif (l'UI ne les expose pas en saisie libre).
  useEffect(() => {
    if (form.type !== 'CPAM') return
    if (form.transportType === null) form.setTransportType('SEATED')
    if (form.passengers == null) form.setPassengers(1)
    if (form.medicalMotif == null) form.setMedicalMotif('HDJ')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type])

  const scheduledAt = useMemo(
    () => when === 'now' ? buildScheduledAt(defaultDate(), defaultTime()) : buildScheduledAt(form.date, form.time),
    [when, form.date, form.time],
  )

  const route = useMissionRoute({ scheduledAt })

  useEffect(() => {
    if (!driverId) return
    let cancelled = false
    groupService.getMyGroups(driverId)
      .then((groups) => {
        if (cancelled) return
        setMyGroups(groups)
        // Pré-sélectionne le 1er groupe si l'utilisateur en a au moins un.
        // Si aucun groupe : bascule la visibilité en PUBLIC pour qu'il puisse poster.
        form.setGroupIds((cur) => (cur.length > 0 ? cur : groups[0] ? [groups[0].id] : []))
        if (groups.length === 0) form.setVisibility('PUBLIC')
      })
      .catch(() => { /* silencieux */ })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId])

  const onSelectDeparture = (s: AddressSuggestion) => {
    form.setDeparture(s.label)
    route.setDepartureCoords({ lat: s.lat, lng: s.lng })
  }
  const onSelectDestination = (s: AddressSuggestion) => {
    form.setDestination(s.label)
    route.setDestinationCoords({ lat: s.lat, lng: s.lng })
  }

  const toggleGroup = (id: string) => {
    form.setVisibility('GROUP')
    form.setGroupIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  const tpmr = form.transportType === 'WHEELCHAIR'
  const setTpmr = (v: boolean) => form.setTransportType(v ? 'WHEELCHAIR' : 'SEATED')

  const voice = useMissionVoiceFiller({
    setType: form.setType,
    setMedicalMotif: form.setMedicalMotif,
    setTransportType: form.setTransportType,
    setReturnTrip: form.setReturnTrip,
    setReturnTime: form.setReturnTime,
    setCompanion: form.setCompanion,
    setPassengers: form.setPassengers,
    setDeparture: form.setDeparture,
    setDestination: form.setDestination,
    setDate: (d) => { setWhen('later'); form.setDate(d) },
    setTime: (t) => { setWhen('later'); form.setTime(t) },
    setPrice: form.setPrice,
    setPriceMin: form.setPriceMin,
    setPriceMax: form.setPriceMax,
    setPatientName: form.setPatientName,
    setPhone: form.setPhone,
    setVisibility: form.setVisibility,
    setGroupIds: form.setGroupIds,
    myGroups,
    setDepartureCoords: route.setDepartureCoords,
    setDestinationCoords: route.setDestinationCoords,
  })

  const { previewFare } = useMissionPricing({
    price: form.price, priceMin: form.priceMin, priceMax: form.priceMax,
    type: form.type, medicalMotif: form.medicalMotif,
    distanceKm: route.distanceKm, durationMin: route.durationMin,
    staticDurationMin: route.staticDurationMin,
    date: when === 'now' ? defaultDate() : form.date,
    time: when === 'now' ? defaultTime() : form.time,
    departure: form.departure, destination: form.destination,
    passengers: form.passengers, transportType: form.transportType,
    returnTrip: form.returnTrip,
  })

  const canSubmit = useMemo(() => {
    if (saving) return false
    if (form.departure.trim().length < 5) return false
    if (form.destination.trim().length < 5) return false
    if (form.type === 'CPAM' && !form.patientName.trim()) return false
    if (form.type === 'CPAM' && !form.medicalMotif) return false
    if (form.visibility === 'GROUP' && form.groupIds.length === 0) return false
    return true
  }, [saving, form.departure, form.destination, form.type, form.patientName,
    form.medicalMotif, form.visibility, form.groupIds])

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      const date = when === 'now' ? defaultDate() : form.date
      const time = when === 'now' ? defaultTime() : form.time
      await submitMission({
        type: form.type,
        medicalMotif: form.medicalMotif,
        transportType: form.transportType,
        returnTrip: form.returnTrip,
        returnTime: form.returnTime,
        companion: form.companion,
        passengers: form.passengers,
        departure: form.departure,
        destination: form.destination,
        departureCoords: route.departureCoords,
        destinationCoords: route.destinationCoords,
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        staticDurationMin: route.staticDurationMin,
        date, time,
        price: form.price,
        priceMin: form.priceMin, priceMax: form.priceMax,
        patientName: form.patientName,
        phone: form.phone,
        notes: form.notes,
        visibility: form.visibility,
        groupIds: form.groupIds,
      })
      if (driverId) await useMissionStore.getState().load(driverId)
      const priceValue = previewFare.value
      publishFeedback({
        type: form.type,
        destination: form.destination,
        priceLabel: priceValue ? `${priceValue.toFixed(2).replace('.', ',')} €` : '—',
      })
      router.push('/dashboard/chauffeur')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication')
      setSaving(false)
    }
  }

  return {
    form,
    when, setWhen,
    tpmr, setTpmr,
    myGroups,
    onSelectDeparture, onSelectDestination,
    toggleGroup,
    voice,
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    loadingRoute: route.loadingRoute,
    previewFare,
    canSubmit, saving, error,
    submit,
  }
}
