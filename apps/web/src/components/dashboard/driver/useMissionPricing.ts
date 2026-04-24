'use client'
import { useMemo } from 'react'
import type { MedicalMotif, TransportType } from '@/lib/validators'
import { computeEffectivePrice } from './computeEffectivePrice'
import type { MissionFormType } from './missionFormHelpers'

interface Params {
  price: string
  priceMin: string
  priceMax: string
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  distanceKm: number | null
  durationMin: number | null
  staticDurationMin?: number | null
  date: string
  time: string
  departure: string
  destination: string
  passengers?: number | null
  transportType?: TransportType | null
  returnTrip?: boolean
}

export function useMissionPricing(p: Params) {
  const effectivePrice = useMemo(
    () => computeEffectivePrice({
      price: p.price, priceMin: p.priceMin, priceMax: p.priceMax,
      type: p.type, medicalMotif: p.medicalMotif,
      distanceKm: p.distanceKm, durationMin: p.durationMin,
      staticDurationMin: p.staticDurationMin ?? null,
      date: p.date, time: p.time,
      departure: p.departure, destination: p.destination,
      passengers: p.passengers ?? null,
      transportType: p.transportType ?? null,
      returnTrip: p.returnTrip ?? false,
    }),
    [p.price, p.priceMin, p.priceMax, p.type, p.medicalMotif,
      p.distanceKm, p.durationMin, p.staticDurationMin,
      p.date, p.time, p.departure, p.destination,
      p.passengers, p.transportType, p.returnTrip],
  )

  const previewFare = useMemo(() => {
    const typedSingle = p.price.trim() ? Number(p.price.replace(',', '.')) : null
    const hasTypedSingle = typedSingle != null && Number.isFinite(typedSingle) && typedSingle > 0
    if (hasTypedSingle) {
      return { value: typedSingle, isEstimated: false, min: null as number | null, max: null as number | null }
    }
    if (effectivePrice?.kind === 'fixed') {
      return { value: effectivePrice.value, isEstimated: effectivePrice.value > 0, min: null, max: null }
    }
    if (effectivePrice?.kind === 'range') {
      const mid = Math.round((effectivePrice.min + effectivePrice.max) / 2)
      const isEstimated = !(p.priceMin.trim() && p.priceMax.trim())
      return { value: mid, isEstimated, min: effectivePrice.min, max: effectivePrice.max }
    }
    return { value: 0, isEstimated: false, min: null, max: null }
  }, [p.price, p.priceMin, p.priceMax, effectivePrice])

  return { effectivePrice, previewFare }
}
