'use client'

import { useEffect, useMemo, useState } from 'react'
import { groupService } from '@/services/groupService'
import { type MissionVisibility } from '@/lib/validators'
import { useDriverStore } from '@/store/driverStore'
import { useMissionStore } from '@/store/missionStore'
import type { Mission } from '@/lib/supabase/types'
import type { Group } from '@taxilink/core'
import type { AddressSuggestion } from '@/services/addressService'
import { initialType, timeFromMission, type MissionFormType } from './missionFormHelpers'
import { useMissionRoute } from './useMissionRoute'
import { submitMission } from './submitMission'

type PaymentMethod = 'CPAM' | 'CASH' | 'CB'

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
  const [payment, setPayment] = useState<PaymentMethod>('CPAM')
  const [visibility, setVisibility] = useState<MissionVisibility>(initialVisibility(mission))
  const [groupId, setGroupId] = useState<string | null>(mission?.group_id ?? null)
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [departure, setDeparture] = useState(mission?.departure ?? '')
  const [destination, setDestination] = useState(mission?.destination ?? '')
  const [time, setTime] = useState(timeFromMission(mission))
  const [price, setPrice] = useState(mission?.price_eur != null ? String(mission.price_eur) : '')
  const [patientName, setPatientName] = useState(mission?.patient_name ?? '')
  const [phone, setPhone] = useState(mission?.phone ?? '')
  const [notes, setNotes] = useState(mission?.notes ?? '')
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

  const canSubmit = useMemo(() => {
    if (saving) return false
    if (departure.trim().length < 5) return false
    if (destination.trim().length < 5) return false
    if (type === 'CPAM' && !patientName.trim()) return false
    if (visibility === 'GROUP' && !groupId) return false
    return true
  }, [saving, departure, destination, type, patientName, visibility, groupId])

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      await submitMission({
        mission, type, departure, destination,
        departureCoords: route.departureCoords,
        destinationCoords: route.destinationCoords,
        distanceKm: route.distanceKm, durationMin: route.durationMin,
        time, price, patientName, phone, notes, visibility, groupId,
      })
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
    type, setType, payment, setPayment,
    visibility, setVisibility, groupId, setGroupId, myGroups,
    departure, setDeparture, destination, setDestination,
    onSelectDeparture, onSelectDestination,
    distanceKm: route.distanceKm, durationMin: route.durationMin,
    loadingRoute: route.loadingRoute, routeError: route.routeError,
    time, setTime, price, setPrice,
    patientName, setPatientName, phone, setPhone, notes, setNotes,
    saving, error, canSubmit, submit,
  }
}
