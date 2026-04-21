'use client'

import { useCallback, useRef } from 'react'
import type { MedicalMotif, MissionVisibility, TransportType } from '@/lib/validators'
import type { Group } from '@taxilink/core'
import type { MissionFormType } from '../missionFormHelpers'
import { smartAddressLookup } from '../smartAddressLookup'

interface Coords { lat: number; lng: number }

export interface GuidedSetters {
  setType: (t: MissionFormType) => void
  setMedicalMotif: (m: MedicalMotif | null) => void
  setTransportType: (t: TransportType | null) => void
  setReturnTrip: (v: boolean) => void
  setReturnTime: (v: string | null) => void
  setCompanion: (v: boolean) => void
  setPassengers: (v: number | null) => void
  setDeparture: (s: string) => void
  setDestination: (s: string) => void
  setDate: (s: string) => void
  setTime: (s: string) => void
  setPatientName: (s: string) => void
  setPhone: (s: string) => void
  setVisibility: (v: MissionVisibility) => void
  setGroupIds: (ids: string[]) => void
  setDepartureCoords: (c: Coords | null) => void
  setDestinationCoords: (c: Coords | null) => void
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '')
}

function matchGroupIds(groups: Group[], names: string[]): string[] {
  const out: string[] = []
  for (const name of names) {
    const target = normalize(name)
    if (!target) continue
    const match = groups.find((g) => {
      const n = normalize(g.name)
      return n === target || n.includes(target) || target.includes(n)
    })
    if (match && !out.includes(match.id)) out.push(match.id)
  }
  return out
}

/**
 * Applique la valeur d'une réponse guidée aux setters de MissionFormState.
 * Gère les cascades (ex: type=PRIVE → clear champs CPAM).
 */
export function useGuidedAnswerApplier(setters: GuidedSetters, myGroups: Group[]) {
  const settersRef = useRef(setters)
  settersRef.current = setters
  const groupsRef = useRef(myGroups)
  groupsRef.current = myGroups

  return useCallback(async (id: string, value: unknown): Promise<void> => {
    const s = settersRef.current
    switch (id) {
      case 'type': {
        const v = value === 'CPAM' || value === 'PRIVE' ? value : null
        if (!v) return
        s.setType(v)
        if (v === 'PRIVE') {
          s.setMedicalMotif(null); s.setTransportType(null)
          s.setReturnTrip(false); s.setReturnTime(null)
          s.setPatientName(''); s.setCompanion(false)
        } else {
          s.setPassengers(null)
        }
        return
      }
      case 'medicalMotif':
        s.setMedicalMotif(value === 'HDJ' || value === 'CONSULTATION' ? value : null)
        return
      case 'transportType':
        if (value === 'SEATED' || value === 'WHEELCHAIR' || value === 'STRETCHER') s.setTransportType(value)
        return
      case 'patientName': if (typeof value === 'string') s.setPatientName(value.trim()); return
      case 'phone':       if (typeof value === 'string') s.setPhone(value.replace(/\s/g, '')); return
      case 'date':        if (typeof value === 'string') s.setDate(value); return
      case 'time':        if (typeof value === 'string') s.setTime(value); return
      case 'returnTrip': {
        const v = !!value
        s.setReturnTrip(v)
        if (!v) s.setReturnTime(null)
        return
      }
      case 'returnTime':  if (typeof value === 'string') s.setReturnTime(value); return
      case 'passengers': {
        const n = typeof value === 'number' ? value : Number(value)
        if (Number.isFinite(n) && n >= 1 && n <= 8) s.setPassengers(Math.round(n))
        return
      }
      case 'companion':   s.setCompanion(!!value); return
      case 'visibility': {
        const v = value === 'PUBLIC' || value === 'GROUP' ? value : null
        if (!v) return
        s.setVisibility(v)
        if (v === 'PUBLIC') s.setGroupIds([])
        return
      }
      case 'groupIds': {
        if (Array.isArray(value)) {
          const raw = value.filter((x): x is string => typeof x === 'string')
          const ids = raw.every((id) => groupsRef.current.some((g) => g.id === id))
            ? raw
            : matchGroupIds(groupsRef.current, raw)
          s.setGroupIds(ids)
        }
        return
      }
      case 'departure':
      case 'destination': {
        const isDeparture = id === 'departure'
        if (value && typeof value === 'object' && 'label' in value) {
          const v = value as { label: string; lat: number; lng: number }
          if (isDeparture) { s.setDeparture(v.label); s.setDepartureCoords({ lat: v.lat, lng: v.lng }) }
          else             { s.setDestination(v.label); s.setDestinationCoords({ lat: v.lat, lng: v.lng }) }
          return
        }
        if (typeof value !== 'string' || !value.trim()) return
        const match = await smartAddressLookup(value).catch(() => null)
        if (match) {
          if (isDeparture) { s.setDeparture(match.label); s.setDepartureCoords({ lat: match.lat, lng: match.lng }) }
          else              { s.setDestination(match.label); s.setDestinationCoords({ lat: match.lat, lng: match.lng }) }
        } else {
          if (isDeparture) s.setDeparture(value.trim())
          else             s.setDestination(value.trim())
        }
        return
      }
    }
  }, [])
}
