'use client'

import { useEffect, useMemo, useState } from 'react'
import { groupService } from '@/services/groupService'
import { type MedicalMotif, type MissionVisibility } from '@/lib/validators'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import type { Mission } from '@/lib/supabase/types'
import type { Group } from '@taxilink/core'
import type { AddressSuggestion } from '@/services/addressService'
import { dateFromMission, initialMedicalMotif, initialType, timeFromMission, type MissionFormType } from './missionFormHelpers'
import { useMissionRoute } from './useMissionRoute'
import { submitMission } from './submitMission'
import { computeEffectivePrice } from './computeEffectivePrice'

function initialVisibility(m: Mission | undefined): MissionVisibility {
  if (m?.visibility === 'PUBLIC') return 'PUBLIC'
  return 'GROUP'
}

function initialCoords(lat: number | null | undefined, lng: number | null | undefined) {
  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng }
  return null
}

export function usePartagerMissionModal(onClose: () => void, mission?: Mission) {
  const isEdit = Boolean(mission)
  const driverId = useDriverStore((s) => s.driver.id)

  const [type, setType] = useState<MissionFormType>(initialType(mission))
  const [medicalMotif, setMedicalMotif] = useState<MedicalMotif | null>(initialMedicalMotif(mission))
  const [visibility, setVisibility] = useState<MissionVisibility>(initialVisibility(mission))
  const [groupId, setGroupId] = useState<string | null>(mission?.group_id ?? null)
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [departure, setDeparture] = useState(mission?.departure ?? '')
  const [destination, setDestination] = useState(mission?.destination ?? '')
  const [date, setDate] = useState(dateFromMission(mission))
  const [time, setTime] = useState(timeFromMission(mission))
  const [price, setPrice] = useState(mission?.price_eur != null ? String(mission.price_eur) : '')
  const [patientName, setPatientName] = useState(mission?.patient_name ?? '')
  const [phone, setPhone] = useState(mission?.phone ?? '')
  const [notes, setNotes] = useState(mission?.notes ?? '')
  const [preview, setPreview] = useState(false)
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const route = useMissionRoute({
    initialDeparture: initialCoords(mission?.departure_lat, mission?.departure_lng),
    initialDestination: initialCoords(mission?.destination_lat, mission?.destination_lng),
    initialDistanceKm: mission?.distance_km ?? null,
    initialDurationMin: mission?.duration_min ?? null,
  })

  useEffect(() => {
    if (!driverId) return
    let cancelled = false
    groupService.getMyGroups(driverId).then((groups) => {
      if (cancelled) return
      setMyGroups(groups)
      setGroupId((current) => current ?? mission?.group_id ?? groups[0]?.id ?? null)
      setVisibility((current) => {
        if (mission) return current
        return groups.length === 0 ? 'PUBLIC' : current
      })
    }).catch(() => { /* silencieux */ })
    return () => { cancelled = true }
  }, [driverId, mission])

  const onSelectDeparture = (s: AddressSuggestion) => {
    setDeparture(s.label)
    route.setDepartureCoords({ lat: s.lat, lng: s.lng })
  }
  const onSelectDestination = (s: AddressSuggestion) => {
    setDestination(s.label)
    route.setDestinationCoords({ lat: s.lat, lng: s.lng })
  }

  const setDepartureCoords = route.setDepartureCoords
  const setDestinationCoords = route.setDestinationCoords

  const effectivePrice = useMemo(
    () => computeEffectivePrice({
      price, type, medicalMotif,
      distanceKm: route.distanceKm,
      date, time, departure, destination,
    }),
    [price, type, medicalMotif, route.distanceKm, date, time, departure, destination],
  )

  const canSubmit = useMemo(() => {
    if (saving) return false
    if (departure.trim().length < 5) return false
    if (destination.trim().length < 5) return false
    if (type === 'CPAM' && !patientName.trim()) return false
    if (type === 'CPAM' && !medicalMotif) return false
    if (visibility === 'GROUP' && !groupId) return false
    return true
  }, [saving, departure, destination, type, patientName, medicalMotif, visibility, groupId])

  const showPreview = () => {
    setError(null)
    setPreview(true)
  }
  const hidePreview = () => setPreview(false)

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      const priceToSubmit = price.trim()
        ? price
        : effectivePrice != null ? String(effectivePrice) : ''
      await submitMission({
        mission, type, medicalMotif, departure, destination,
        departureCoords: route.departureCoords,
        destinationCoords: route.destinationCoords,
        distanceKm: route.distanceKm, durationMin: route.durationMin,
        date, time, price: priceToSubmit, patientName, phone, notes, visibility, groupId,
      })
      if (driverId) await useMissionStore.getState().load(driverId)
      setPreview(false)
      setPublished(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? 'Erreur lors de la mise à jour' : 'Erreur lors de la publication')
      setPreview(false)
    } finally {
      setSaving(false)
    }
  }

  return {
    isEdit,
    type, setType, medicalMotif, setMedicalMotif,
    visibility, setVisibility, groupId, setGroupId, myGroups,
    departure, setDeparture, destination, setDestination,
    onSelectDeparture, onSelectDestination,
    setDepartureCoords, setDestinationCoords,
    distanceKm: route.distanceKm, durationMin: route.durationMin,
    loadingRoute: route.loadingRoute, routeError: route.routeError,
    date, setDate, time, setTime, price, setPrice, effectivePrice,
    patientName, setPatientName, phone, setPhone, notes, setNotes,
    preview, showPreview, hidePreview,
    published,
    saving, error, canSubmit, submit,
  }
}
