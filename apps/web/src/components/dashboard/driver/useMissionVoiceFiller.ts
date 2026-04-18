'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoiceDictation } from '@/hooks/useVoiceDictation'
import { parseVoiceTranscript, type ParsedMissionFields } from '@/services/voiceParseService'
import type { MissionFormType } from './missionFormHelpers'
import type { MedicalMotif } from '@/lib/validators'
import { searchAddresses, searchPlaces, type AddressSuggestion } from '@/services/addressService'

const POI_REGEX = /h[oô]pital|clinique|gare|a[ée]roport|pharmacie|mairie|[ée]cole|lyc[ée]e|coll[èe]ge|universit[ée]|stade|piscine|m[ée]diath[èe]que|cabinet|laboratoire|ehpad|centre commercial|maison de retraite|cimeti[èe]re/i
const STREET_REGEX = /\b(rue|avenue|av|boulevard|bd|place|impasse|chemin|route|all[ée]e|cours|quai|square|esplanade|parvis)\b/i

function rewriteArrondissement(q: string): string {
  if (STREET_REGEX.test(q) || POI_REGEX.test(q)) return q
  const city = /\bparis\b/i.test(q) ? 'Paris' : /\bmarseille\b/i.test(q) ? 'Marseille' : /\blyon\b/i.test(q) ? 'Lyon' : null
  if (!city) return q
  const m = q.match(/\b(\d{1,2})(?:\s*(?:e|è|er|ère|ème|eme|arrondissement))?\b/i)
  const num = m ? parseInt(m[1]!, 10) : 0
  if (num < 1 || num > 20) return q
  return `Mairie du ${num}${num === 1 ? 'er' : 'e'} arrondissement ${city}`
}

async function smartLookup(raw: string): Promise<AddressSuggestion | null> {
  const query = rewriteArrondissement(raw)
  const isPOI = POI_REGEX.test(query)
  if (isPOI) {
    const r = await searchPlaces(query, undefined, true).catch(() => [])
    if (r[0]) return r[0]
    const fb = await searchAddresses(query).catch(() => [])
    return fb[0] ?? null
  }
  const r = await searchAddresses(query).catch(() => [])
  if (r[0]) return r[0]
  const fb = await searchPlaces(query).catch(() => [])
  return fb[0] ?? null
}

const MIC_ERRORS: Record<string, string> = {
  'no-speech': 'Aucune voix détectée. Parlez plus fort ou rapprochez-vous du micro.',
  'audio-capture': 'Micro indisponible. Vérifiez qu\'il est branché et autorisé.',
  'not-allowed': 'Accès micro refusé. Autorisez-le dans les paramètres du navigateur.',
  'service-not-allowed': 'Accès micro refusé. Autorisez-le dans les paramètres du navigateur.',
  'network': 'Pas de réseau. La dictée Chrome nécessite Internet.',
  'aborted': 'Dictée interrompue.',
  'language-not-supported': 'Langue non supportée par votre navigateur.',
}
const micErrorLabel = (c: string | null) => c ? (MIC_ERRORS[c] ?? `Erreur micro (${c})`) : null

interface Coords { lat: number; lng: number }

interface Args {
  setType: (t: MissionFormType) => void
  setMedicalMotif: (m: MedicalMotif | null) => void
  setDeparture: (s: string) => void
  setDestination: (s: string) => void
  setDate: (s: string) => void
  setTime: (s: string) => void
  setPrice: (s: string) => void
  setPatientName: (s: string) => void
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
      transcriptRef.current = transcriptRef.current
        ? `${transcriptRef.current} ${text}`
        : text
      setTranscript(transcriptRef.current)
    },
  })

  const applyParsed = useCallback(async (parsed: ParsedMissionFields) => {
    const a = argsRef.current
    if (parsed.type) a.setType(parsed.type)
    if (parsed.type === 'PRIVE') a.setMedicalMotif(null)
    else if (parsed.medical_motif) a.setMedicalMotif(parsed.medical_motif)
    if (parsed.date) a.setDate(parsed.date)
    if (parsed.time) a.setTime(parsed.time)
    if (parsed.price_eur != null) a.setPrice(String(parsed.price_eur))
    if (parsed.patient_name) a.setPatientName(parsed.patient_name)

    if (parsed.departure) {
      const match = await smartLookup(parsed.departure)
      if (match) {
        a.setDeparture(match.label)
        a.setDepartureCoords({ lat: match.lat, lng: match.lng })
      } else {
        a.setDeparture(parsed.departure)
      }
    }
    if (parsed.destination) {
      const match = await smartLookup(parsed.destination)
      if (match) {
        a.setDestination(match.label)
        a.setDestinationCoords({ lat: match.lat, lng: match.lng })
      } else {
        a.setDestination(parsed.destination)
      }
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

  const stop = useCallback(() => {
    voice.stop()
  }, [voice])

  return {
    isSupported: voice.isSupported,
    isListening: voice.isListening,
    isProcessing,
    interimTranscript: voice.interimTranscript,
    transcript,
    error: micErrorLabel(voice.error) ?? parseError,
    start,
    stop,
  }
}
