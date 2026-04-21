'use client'

import { useEffect, useMemo, useState } from 'react'
import { groupService } from '@/services/groupService'
import { missionGroupsService } from '@/services/missionGroupsService'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import type { Mission } from '@/lib/supabase/types'
import type { Group } from '@taxilink/core'
import type { AddressSuggestion } from '@/services/addressService'
import { buildScheduledAt, initialCoords } from './missionFormHelpers'
import { useMissionRoute } from './useMissionRoute'
import { useMissionFormState } from './useMissionFormState'
import { submitMission } from './submitMission'
import { useMissionPricing } from './useMissionPricing'

export function usePartagerMissionModal(_onClose: () => void, mission?: Mission) {
  const isEdit = Boolean(mission)
  const driverId = useDriverStore((s) => s.driver.id)
  const form = useMissionFormState(mission)

  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [preview, setPreview] = useState(false)
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scheduledAt = useMemo(() => buildScheduledAt(form.date, form.time), [form.date, form.time])

  const route = useMissionRoute({
    initialDeparture: initialCoords(mission?.departure_lat, mission?.departure_lng),
    initialDestination: initialCoords(mission?.destination_lat, mission?.destination_lng),
    initialDistanceKm: mission?.distance_km ?? null,
    initialDurationMin: mission?.duration_min ?? null,
    scheduledAt,
  })

  useEffect(() => {
    if (!driverId) return
    let cancelled = false
    const missionId = mission?.id
    Promise.all([
      groupService.getMyGroups(driverId),
      missionId ? missionGroupsService.getGroupIds(missionId) : Promise.resolve<string[]>([]),
    ]).then(([groups, existingGroupIds]) => {
      if (cancelled) return
      setMyGroups(groups)
      form.setGroupIds((cur) => {
        if (cur.length > 0) return cur
        if (existingGroupIds.length > 0) return existingGroupIds
        return groups[0] ? [groups[0].id] : []
      })
      if (!mission && groups.length === 0) form.setVisibility('PUBLIC')
    }).catch(() => { /* silencieux */ })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId, mission])

  const onSelectDeparture = (s: AddressSuggestion) => {
    form.setDeparture(s.label)
    route.setDepartureCoords({ lat: s.lat, lng: s.lng })
  }
  const onSelectDestination = (s: AddressSuggestion) => {
    form.setDestination(s.label)
    route.setDestinationCoords({ lat: s.lat, lng: s.lng })
  }

  const onSelectPublic = () => {
    form.setVisibility('PUBLIC')
    form.setGroupIds([])
  }
  const onToggleGroup = (id: string) => {
    form.setVisibility('GROUP')
    form.setGroupIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  const { effectivePrice, previewFare } = useMissionPricing({
    price: form.price, priceMin: form.priceMin, priceMax: form.priceMax,
    type: form.type, medicalMotif: form.medicalMotif,
    distanceKm: route.distanceKm, durationMin: route.durationMin,
    date: form.date, time: form.time,
    departure: form.departure, destination: form.destination,
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

  const showPreview = () => { setError(null); setPreview(true) }
  const hidePreview = () => setPreview(false)

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      await submitMission({
        mission,
        type: form.type, medicalMotif: form.medicalMotif,
        transportType: form.transportType,
        returnTrip: form.returnTrip, returnTime: form.returnTime,
        companion: form.companion, passengers: form.passengers,
        departure: form.departure, destination: form.destination,
        departureCoords: route.departureCoords,
        destinationCoords: route.destinationCoords,
        distanceKm: route.distanceKm, durationMin: route.durationMin,
        date: form.date, time: form.time,
        price: form.price,
        priceMin: form.priceMin, priceMax: form.priceMax,
        patientName: form.patientName, phone: form.phone, notes: form.notes,
        visibility: form.visibility,
        groupIds: form.groupIds,
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
    ...form,
    myGroups,
    onSelectDeparture, onSelectDestination,
    departureCoords: route.departureCoords, destinationCoords: route.destinationCoords,
    setDepartureCoords: route.setDepartureCoords,
    setDestinationCoords: route.setDestinationCoords,
    onSelectPublic, onToggleGroup,
    distanceKm: route.distanceKm, durationMin: route.durationMin,
    routeGeometry: route.routeGeometry,
    loadingRoute: route.loadingRoute, routeError: route.routeError,
    effectivePrice, previewFare,
    preview, showPreview, hidePreview,
    published, saving, error, canSubmit, submit,
  }
}
