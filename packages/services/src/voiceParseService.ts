import { api } from './lib/api'
import type {
  MedicalMotif,
  MissionVisibility,
  TransportType,
} from '@taxilink/core'

export type MissionFormType = 'CPAM' | 'PRIVE'

export interface ParsedMissionFields {
  type: MissionFormType | null
  medical_motif: MedicalMotif | null
  transport_type: TransportType | null
  return_trip: boolean
  return_time: string | null
  companion: boolean
  passengers: number | null
  departure: string | null
  destination: string | null
  date: string | null
  time: string | null
  price_eur: number | null
  price_min_eur: number | null
  price_max_eur: number | null
  patient_name: string | null
  phone: string | null
  visibility: MissionVisibility | null
  group_names: string[]
  extra_bagages: number | null
  extra_encombrants: number | null
  // Remarques libres du chauffeur (code immeuble, etage, patient sourd, etc.).
  // Tout ce qui aide le preneur sans entrer dans les champs structures.
  notes: string | null
  // CPAM uniquement : documents que le chauffeur preneur devra recuperer chez
  // le patient. null = non mentionne (on ne change pas le defaut UI = true).
  // true / false = explicitement dit ("avec bulletin" / "sans bon de transport").
  pickup_bulletin: boolean | null
  pickup_bon_transport: boolean | null
  transcript: string
}

/**
 * Accepte soit un Blob (web — DOM File API dispo), soit un objet
 * `{ uri, type }` (React Native — File n'existe pas, FormData attend une URI).
 */
export type VoiceAudioInput = Blob | { uri: string; type?: string }

export async function parseVoiceAudio(audio: VoiceAudioInput): Promise<ParsedMissionFields> {
  const form = new FormData()
  if (audio instanceof Blob) {
    const ext = (audio.type || 'audio/webm').includes('mp4') ? 'mp4' : 'webm'
    const file = new File([audio], `audio.${ext}`, { type: audio.type || 'audio/webm' })
    form.append('audio', file)
  } else {
    const type = audio.type || 'audio/m4a'
    const ext = type.includes('mp4') ? 'mp4' : type.includes('m4a') ? 'm4a' : 'webm'
    // React Native pattern : FormData accepte un objet { uri, type, name }
    // pour les uploads de fichier — pas de wrapper File requis.
    form.append('audio', { uri: audio.uri, type, name: `audio.${ext}` } as never)
  }
  return api.postForm<ParsedMissionFields>('/api/missions/parse-voice', form)
}
