'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import type { AddressSuggestion } from '@/services/addressService'
import { buildScheduledAt, defaultDate, defaultTime } from '@/components/dashboard/driver/missionFormHelpers'
import { useMissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import { useMissionRoute } from '@/components/dashboard/driver/useMissionRoute'
import { useMissionPricing } from '@/components/dashboard/driver/useMissionPricing'
import { useMissionVoiceFiller } from '@/components/dashboard/driver/useMissionVoiceFiller'
import { submitMission } from '@/components/dashboard/driver/submitMission'
import { shareCourseOnWhatsApp } from '@/lib/shareWhatsApp'
import { usePosterVoiceFlow } from './usePosterVoiceFlow'
import { usePosterGroupsLoader } from './usePosterGroupsLoader'

export type WhenMode = 'now' | 'later'

export function usePosterCourse() {
  const router = useRouter()
  const driverId = useDriverStore((s) => s.driver.id)
  const form = useMissionFormState(undefined)

  const [when, setWhen] = useState<WhenMode>('now')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [published, setPublished] = useState(false)

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

  const myGroups = usePosterGroupsLoader(driverId, () => {
    form.setVisibility('PUBLIC')
    form.setGroupIds([])
  })

  const onSelectPublic = () => {
    form.setVisibility('PUBLIC')
    form.setGroupIds([])
  }

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
    setType: form.setType, setMedicalMotif: form.setMedicalMotif,
    setTransportType: form.setTransportType, setReturnTrip: form.setReturnTrip,
    setReturnTime: form.setReturnTime, setCompanion: form.setCompanion, setPassengers: form.setPassengers,
    setDeparture: form.setDeparture, setDestination: form.setDestination,
    setDate: (d) => { setWhen('later'); form.setDate(d) },
    setTime: (t) => { setWhen('later'); form.setTime(t) },
    setPrice: form.setPrice, setPriceMin: form.setPriceMin, setPriceMax: form.setPriceMax,
    setPatientName: form.setPatientName, setPhone: form.setPhone,
    setVisibility: form.setVisibility, setGroupIds: form.setGroupIds, myGroups,
    setDepartureCoords: route.setDepartureCoords, setDestinationCoords: route.setDestinationCoords,
    setExtraBagages: form.setExtraBagages, setExtraEncombrants: form.setExtraEncombrants,
  })

  const voiceFlow = usePosterVoiceFlow({
    filler: voice,
    form,
    myGroups,
    setDepartureCoords: route.setDepartureCoords,
    setDestinationCoords: route.setDestinationCoords,
    setWhenLater: () => setWhen('later'),
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
    extraBagages: form.extraBagages,
    extraEncombrants: form.extraEncombrants,
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

  const submit = async (opts?: { share?: boolean }) => {
    setError(null)
    setSaving(true)
    try {
      const date = when === 'now' ? defaultDate() : form.date
      const time = when === 'now' ? defaultTime() : form.time
      const id = await submitMission({
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
      if (opts?.share) {
        shareCourseOnWhatsApp({ id, departure: form.departure, destination: form.destination })
      }
      // Pas de redirection immediate : on bascule sur l'ecran "publiee" plein
      // ecran (pouce vert + Bravo). MissionPublishedCelebration appelle
      // dismissCelebration apres 2.5s qui redirige.
      setPublished(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication')
      setSaving(false)
    }
  }

  const dismissCelebration = () => {
    router.push('/dashboard/chauffeur')
  }

  return {
    form,
    driverId,
    when, setWhen,
    tpmr, setTpmr,
    myGroups,
    onSelectDeparture, onSelectDestination,
    toggleGroup,
    onSelectPublic,
    voice, voiceFlow,
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    loadingRoute: route.loadingRoute,
    previewFare,
    canSubmit, saving, error,
    submit,
    published, dismissCelebration,
  }
}
