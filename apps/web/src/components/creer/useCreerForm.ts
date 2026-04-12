import { useReducer, useState } from 'react'
import { useNavStore } from '@/store/navStore'
import { estimateRoute } from '@/lib/utils'
import { validateMission } from '@/lib/validators'
import { missionService } from '@/services/missionService'
import { ApiRequestError } from '@/lib/api'
import type { MissionType } from './MissionTypeSelector'
import type { VehicleType } from './VehicleSelector'

export const VEHICLE_TO_MISSION: Record<MissionType, 'CPAM' | 'PRIVE' | 'TAXILINK'> = {
  prive: 'PRIVE',
  cpam: 'CPAM',
}

export type FormState = {
  missionType: MissionType
  vehicleType: VehicleType
  departure: string
  destination: string
  distance: string
  duration: string
  price: string
  patientName: string
  phone: string
  notes: string
}

export type FormAction =
  | { type: 'SET_MISSION_TYPE'; value: MissionType }
  | { type: 'SET_VEHICLE_TYPE'; value: VehicleType }
  | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'missionType' | 'vehicleType'>; value: string }
  | { type: 'SET_CALCULATED'; distance: string; duration: string; price: string }

const initialForm: FormState = {
  missionType: 'prive',
  vehicleType: 'standard',
  departure: '',
  destination: '',
  distance: '',
  duration: '',
  price: '',
  patientName: '',
  phone: '',
  notes: '',
}

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_MISSION_TYPE':  return { ...state, missionType: action.value }
    case 'SET_VEHICLE_TYPE':  return { ...state, vehicleType: action.value }
    case 'SET_FIELD':         return { ...state, [action.field]: action.value }
    case 'SET_CALCULATED':    return { ...state, distance: action.distance, duration: action.duration, price: action.price }
    default: return state
  }
}

export function useCreerForm() {
  const { setScreen } = useNavStore()
  const [form, dispatch] = useReducer(formReducer, initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleCalculate = () => {
    if (form.departure && form.destination) {
      const { distanceKm, duration, price } = estimateRoute()
      dispatch({ type: 'SET_CALCULATED', distance: String(distanceKm), duration: String(duration), price: price.toFixed(2) })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const missionData = {
      type: VEHICLE_TO_MISSION[form.missionType],
      departure: form.departure,
      destination: form.destination,
      distance_km:  form.distance  ? parseFloat(form.distance)  : null,
      duration_min: form.duration  ? parseInt(form.duration)    : null,
      price_eur:    form.price     ? parseFloat(form.price)     : null,
      patient_name: form.patientName || null,
      phone:        form.phone     || null,
      notes:        form.notes     || null,
    }
    const clientErrors = validateMission(missionData)
    if (clientErrors.length > 0) { setError(clientErrors[0].message); return }

    setSubmitting(true)
    try {
      await missionService.create(missionData)
      setScreen('flux')
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Impossible de contacter le serveur')
    } finally {
      setSubmitting(false)
    }
  }

  return { form, dispatch, submitting, error, handleCalculate, handleSubmit }
}
