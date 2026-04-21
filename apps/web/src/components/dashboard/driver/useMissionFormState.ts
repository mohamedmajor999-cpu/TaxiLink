'use client'

import { useState } from 'react'
import type { MedicalMotif, MissionVisibility, TransportType } from '@/lib/validators'
import type { Mission } from '@/lib/supabase/types'
import {
  dateFromMission,
  initialMedicalMotif,
  initialType,
  timeFromMission,
  type MissionFormType,
} from './missionFormHelpers'

function initialVisibility(m: Mission | undefined): MissionVisibility {
  if (m?.visibility === 'PUBLIC') return 'PUBLIC'
  return 'GROUP'
}

function initialTransportType(m: Mission | undefined): TransportType | null {
  const t = m?.transport_type
  if (t === 'SEATED' || t === 'WHEELCHAIR' || t === 'STRETCHER') return t
  return null
}

export function useMissionFormState(mission: Mission | undefined) {
  const [type, setType] = useState<MissionFormType>(initialType(mission))
  const [medicalMotif, setMedicalMotif] = useState<MedicalMotif | null>(initialMedicalMotif(mission))
  const [transportType, setTransportType] = useState<TransportType | null>(initialTransportType(mission))
  const [returnTrip, setReturnTrip] = useState<boolean>(mission?.return_trip ?? false)
  const [returnTime, setReturnTime] = useState<string | null>(mission?.return_time ?? null)
  const [companion, setCompanion] = useState<boolean>(mission?.companion ?? false)
  const [passengers, setPassengers] = useState<number | null>(mission?.passengers ?? null)
  const [visibility, setVisibility] = useState<MissionVisibility>(initialVisibility(mission))
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [departure, setDeparture] = useState(mission?.departure ?? '')
  const [destination, setDestination] = useState(mission?.destination ?? '')
  const [date, setDate] = useState(dateFromMission(mission))
  const [time, setTime] = useState(timeFromMission(mission))
  // `price` : CPAM ou privé avec prix fixe ; vide si fourchette utilisée.
  const [price, setPrice] = useState(
    mission?.price_eur != null && mission.price_min_eur == null ? String(mission.price_eur) : '',
  )
  // Fourchette (privé uniquement) : pré-remplie depuis la mission si éditée avec range.
  const [priceMin, setPriceMin] = useState(
    mission?.price_min_eur != null ? String(mission.price_min_eur) : '',
  )
  const [priceMax, setPriceMax] = useState(
    mission?.price_max_eur != null ? String(mission.price_max_eur) : '',
  )
  const [patientName, setPatientName] = useState(mission?.patient_name ?? '')
  const [phone, setPhone] = useState(mission?.phone ?? '')
  const [notes, setNotes] = useState(mission?.notes ?? '')

  return {
    type, setType, medicalMotif, setMedicalMotif,
    transportType, setTransportType,
    returnTrip, setReturnTrip, returnTime, setReturnTime,
    companion, setCompanion, passengers, setPassengers,
    visibility, setVisibility, groupIds, setGroupIds,
    departure, setDeparture, destination, setDestination,
    date, setDate, time, setTime,
    price, setPrice,
    priceMin, setPriceMin, priceMax, setPriceMax,
    patientName, setPatientName,
    phone, setPhone, notes, setNotes,
  }
}

export type MissionFormState = ReturnType<typeof useMissionFormState>
