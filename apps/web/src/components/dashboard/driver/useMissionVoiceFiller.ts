'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoiceDictation } from '@/hooks/useVoiceDictation'
import { parseVoiceTranscript, type ParsedMissionFields } from '@/services/voiceParseService'
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
}

export function useMissionVoiceFiller(args: Args) {
  const argsRef = useRef(args)
  argsRef.current = args

  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const transcriptRef = useRef('')
  const shouldProcessRef = useRef(false)

  const voice = useVoiceDictation({
    lang: 'fr-FR',
    continuous: true,
    onFinalTranscript: (text) => {
      transcriptRef.current = transcriptRef.current ? `${transcriptRef.current} ${text}` : text
      setTranscript(transcriptRef.current)
    },
  })

  const applyParsed = useCallback(async (parsed: ParsedMissionFields) => {
    const a = argsRef.current
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
    if (parsed.date) a.setDate(parsed.date)
    if (parsed.time) a.setTime(parsed.time)
    // Privé avec fourchette : renseigne min + max (et laisse `price` vide).
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

  useEffect(() => {
    if (voice.isListening || !shouldProcessRef.current) return
    shouldProcessRef.current = false
    const full = transcriptRef.current.trim()
    if (full.length < 3) return
    setIsProcessing(true)
    parseVoiceTranscript(full)
      .then(applyParsed)
      .catch((err) => setParseError(err instanceof Error ? err.message : 'Erreur IA'))
      .finally(() => setIsProcessing(false))
  }, [voice.isListening, applyParsed])

  const start = useCallback(() => {
    transcriptRef.current = ''
    setTranscript('')
    setParseError(null)
    shouldProcessRef.current = true
    voice.start()
  }, [voice])

  const stop = useCallback(() => { voice.stop() }, [voice])

  return {
    isSupported: voice.isSupported,
    isListening: voice.isListening,
    isProcessing,
    interimTranscript: voice.interimTranscript,
    transcript,
    error: micErrorLabel(voice.error) ?? parseError,
    start, stop,
  }
}
