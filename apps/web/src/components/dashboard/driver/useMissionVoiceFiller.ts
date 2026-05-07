'use client'

import { useCallback, useRef, useState } from 'react'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { parseVoiceAudio, type ParsedMissionFields } from '@/services/voiceParseService'
import type { MissionFormType } from './missionFormHelpers'
import type { MedicalMotif, MissionVisibility, TransportType } from '@/lib/validators'
import type { Group } from '@taxilink/core'
import { smartAddressLookup } from './smartAddressLookup'
import { matchGroupIds, micErrorLabel } from './voiceFillerHelpers'

interface Coords { lat: number; lng: number }

interface Args {
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
  setPrice: (s: string) => void
  setPriceMin: (s: string) => void
  setPriceMax: (s: string) => void
  setPatientName: (s: string) => void
  setPhone: (s: string) => void
  setVisibility: (v: MissionVisibility) => void
  setGroupIds: (ids: string[]) => void
  myGroups: Group[]
  setDepartureCoords: (c: Coords | null) => void
  setDestinationCoords: (c: Coords | null) => void
  setExtraBagages?: (n: number) => void
  setExtraEncombrants?: (n: number) => void
}

export function useMissionVoiceFiller(args: Args) {
  const argsRef = useRef(args)
  argsRef.current = args

  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [recorderError, setRecorderError] = useState<string | null>(null)
  const [parsedFields, setParsedFields] = useState<Set<string>>(() => new Set())
  const parsedFieldsRef = useRef<Set<string>>(new Set())

  const applyParsed = useCallback(async (parsed: ParsedMissionFields) => {
    const a = argsRef.current
    const fields = new Set(parsedFieldsRef.current)
    const add = (cond: unknown, k: string) => { if (cond) fields.add(k) }
    add(parsed.type, 'type'); add(parsed.medical_motif, 'medicalMotif')
    add(parsed.date, 'date'); add(parsed.time, 'time')
    add(parsed.departure, 'departure'); add(parsed.destination, 'destination')
    add(parsed.phone, 'phone'); add(parsed.return_trip, 'returnTrip')
    add(parsed.passengers != null, 'passengers')
    add(parsed.extra_bagages != null && parsed.extra_bagages > 0, 'extraBagages')
    add(parsed.extra_encombrants != null && parsed.extra_encombrants > 0, 'extraEncombrants')
    parsedFieldsRef.current = fields
    setParsedFields(fields)

    if (parsed.type) a.setType(parsed.type)
    if (parsed.type === 'PRIVE') { a.setMedicalMotif(null); a.setTransportType(null); a.setReturnTrip(false); a.setReturnTime(null) }
    else {
      if (parsed.medical_motif) a.setMedicalMotif(parsed.medical_motif)
      if (parsed.transport_type) a.setTransportType(parsed.transport_type)
      if (parsed.return_trip) a.setReturnTrip(true)
      if (parsed.return_time) a.setReturnTime(parsed.return_time)
    }
    if (parsed.companion) a.setCompanion(true)
    if (parsed.passengers != null) a.setPassengers(parsed.passengers)
    if (parsed.extra_bagages != null && a.setExtraBagages) {
      a.setExtraBagages(Math.max(0, parsed.extra_bagages))
    }
    if (parsed.extra_encombrants != null && a.setExtraEncombrants) {
      a.setExtraEncombrants(Math.max(0, parsed.extra_encombrants))
    }
    if (parsed.date) a.setDate(parsed.date)
    if (parsed.time) a.setTime(parsed.time)
    if (parsed.price_min_eur != null && parsed.price_max_eur != null) {
      a.setPriceMin(String(parsed.price_min_eur))
      a.setPriceMax(String(parsed.price_max_eur))
    } else if (parsed.price_eur != null) {
      a.setPrice(String(parsed.price_eur))
    }
    if (parsed.patient_name) a.setPatientName(parsed.patient_name)
    if (parsed.phone) a.setPhone(parsed.phone)

    if (parsed.visibility === 'PUBLIC') {
      a.setVisibility('PUBLIC'); a.setGroupIds([])
    } else if (parsed.visibility === 'GROUP' || parsed.group_names?.length) {
      const matched = matchGroupIds(a.myGroups, parsed.group_names ?? [])
      a.setVisibility('GROUP')
      if (matched.length > 0) a.setGroupIds(matched)
    }

    if (parsed.departure) {
      const match = await smartAddressLookup(parsed.departure)
      if (match) { a.setDeparture(match.label); a.setDepartureCoords({ lat: match.lat, lng: match.lng }) }
      else a.setDeparture(parsed.departure)
    }
    if (parsed.destination) {
      const match = await smartAddressLookup(parsed.destination)
      if (match) { a.setDestination(match.label); a.setDestinationCoords({ lat: match.lat, lng: match.lng }) }
      else a.setDestination(parsed.destination)
    }
  }, [])

  const handleAudio = useCallback(async (blob: Blob) => {
    if (blob.size === 0) return
    setIsProcessing(true)
    setParseError(null)
    try {
      const parsed = await parseVoiceAudio(blob)
      setTranscript(parsed.transcript ?? '')
      await applyParsed(parsed)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setIsProcessing(false)
    }
  }, [applyParsed])

  const recorder = useAudioRecorder({
    onStop: handleAudio,
    onError: (code) => setRecorderError(code),
  })

  const start = useCallback(() => {
    setTranscript('')
    setParseError(null)
    setRecorderError(null)
    void recorder.start()
  }, [recorder])

  const stop = useCallback(() => { recorder.stop() }, [recorder])

  const resetParsedFields = useCallback(() => {
    parsedFieldsRef.current = new Set()
    setParsedFields(new Set())
  }, [])

  return {
    isSupported: recorder.isSupported,
    isListening: recorder.isRecording,
    isProcessing,
    interimTranscript: '',
    transcript,
    error: micErrorLabel(recorderError) ?? parseError,
    parsedFields,
    resetParsedFields,
    start, stop,
  }
}
