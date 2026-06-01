import { useRef, useState } from 'react';
import { searchGoogle, resolveGooglePlace, findKnownPlaceMarseille, type ParsedMissionFields } from '@taxilink/services';
import type { Group, MissionVisibility, MedicalMotif, TransportType } from '@taxilink/core';

import { useMobileVoiceRecorder } from './useMobileVoiceRecorder';
import { parseVoiceMobile } from './mobileVoiceParseService';

// Centre Marseille pour bias géo Google. Voir useFieldAddressVoice pour
// l'explication détaillée.
const MARSEILLE_BIAS = { lat: 43.2965, lng: 5.3698 };

interface FieldSetters {
  setType: (t: 'CPAM' | 'PRIVE') => void;
  setMedicalMotif: (m: MedicalMotif | null) => void;
  setTransportType: (t: TransportType | null) => void;
  setReturnTrip: (v: boolean) => void;
  setPassengers: (n: number) => void;
  setDeparture: (s: string) => void;
  setDestination: (s: string) => void;
  setDate: (s: string) => void;
  setTime: (s: string) => void;
  setWhen: (m: 'now' | 'later') => void;
  setPrice: (s: string) => void;
  setPriceMin: (s: string) => void;
  setPriceMax: (s: string) => void;
  setPatientName: (s: string) => void;
  setPhone: (s: string) => void;
  setNotes: (s: string) => void;
  setVisibility: (v: MissionVisibility) => void;
  setGroupIds: (ids: string[]) => void;
  setDepartureCoords: (c: { lat: number; lng: number } | null) => void;
  setDestinationCoords: (c: { lat: number; lng: number } | null) => void;
  setExtraBagages: (n: number) => void;
  setExtraEncombrants: (n: number) => void;
  setPickupBulletin: (v: boolean) => void;
  setPickupBonTransport: (v: boolean) => void;
  myGroups: Group[];
}

function matchGroupIds(myGroups: Group[], names: string[]): string[] {
  const lowerNames = names.map((n) => n.toLowerCase());
  return myGroups.filter((g) => lowerNames.some((n) => g.name.toLowerCase().includes(n))).map((g) => g.id);
}

/**
 * Smart address lookup en 2 étapes :
 * 1) Banque locale (hôpitaux, gares, aéroport Marseille) — match instantané
 *    sans appel API. Label canonique + coords vérifiées à la main.
 * 2) Google Places avec bias Marseille — fallback si l'adresse n'est pas
 *    dans la banque locale.
 * Retourne null si rien ne matche (saisie brute conservée).
 */
async function smartAddressLookup(query: string): Promise<{ label: string; lat: number; lng: number } | null> {
  if (!query || query.length < 3) return null;
  const known = findKnownPlaceMarseille(query);
  // Coords présentes → bypass Google. Sinon on garde le label canonique pour
  // l'envoyer à Google (plus fiable que le transcript brut Whisper).
  if (known?.coords) return { label: known.label, lat: known.coords.lat, lng: known.coords.lng };
  const baseQuery = known?.label ?? query;

  // 2 variantes en cascade : direct, puis avec suffixe ", Bouches-du-Rhône"
  // si la 1ère échoue. La 2ème ne tourne que si la 1ère retourne rien.
  const queries = [baseQuery, `${baseQuery}, Bouches-du-Rhône`];
  let first: { label: string; lat: number; lng: number; placeId?: string } | undefined;
  try {
    for (const q of queries) {
      const sugg = await searchGoogle(q, undefined, MARSEILLE_BIAS).catch(() => []);
      if (sugg[0]) { first = sugg[0]; break; }
    }
    if (!first) return null;
    // searchGoogle renvoie lat=0, lng=0 comme placeholders → toujours resolveGooglePlace.
    if ((first.lat !== 0 || first.lng !== 0) && typeof first.lat === 'number' && typeof first.lng === 'number') {
      return { label: first.label, lat: first.lat, lng: first.lng };
    }
    if (!first.placeId) return null;
    const details = await resolveGooglePlace(first.placeId);
    return details ? { label: first.label, lat: details.lat, lng: details.lng } : null;
  } catch {
    return null;
  }
}

export function usePosterVoiceFlow(setters: FieldSetters) {
  const settersRef = useRef(setters);
  settersRef.current = setters;
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  async function applyParsed(parsed: ParsedMissionFields) {
    const a = settersRef.current;
    if (parsed.type) a.setType(parsed.type as 'CPAM' | 'PRIVE');
    if (parsed.type === 'PRIVE') {
      a.setMedicalMotif(null); a.setTransportType(null); a.setReturnTrip(false);
    } else if (parsed.type === 'CPAM') {
      if (parsed.medical_motif) a.setMedicalMotif(parsed.medical_motif as MedicalMotif);
      if (parsed.transport_type) a.setTransportType(parsed.transport_type as TransportType);
      if (parsed.return_trip) a.setReturnTrip(true);
      // Documents a recuperer : null = non mentionne, on garde le defaut UI
      // (les 2 cas oui). true/false explicite = on applique. Le user peut
      // dire "sans bulletin" pour decocher.
      if (parsed.pickup_bulletin === true) a.setPickupBulletin(true);
      else if (parsed.pickup_bulletin === false) a.setPickupBulletin(false);
      if (parsed.pickup_bon_transport === true) a.setPickupBonTransport(true);
      else if (parsed.pickup_bon_transport === false) a.setPickupBonTransport(false);
    }
    if (parsed.passengers != null) a.setPassengers(Math.max(1, parsed.passengers));
    if (parsed.extra_bagages != null) a.setExtraBagages(Math.max(0, parsed.extra_bagages));
    if (parsed.extra_encombrants != null) a.setExtraEncombrants(Math.max(0, parsed.extra_encombrants));
    if (parsed.date) { a.setWhen('later'); a.setDate(parsed.date); }
    if (parsed.time) { a.setWhen('later'); a.setTime(parsed.time); }
    if (parsed.price_min_eur != null && parsed.price_max_eur != null) {
      a.setPriceMin(String(parsed.price_min_eur)); a.setPriceMax(String(parsed.price_max_eur));
    } else if (parsed.price_eur != null) {
      a.setPrice(String(parsed.price_eur));
    }
    if (parsed.patient_name) a.setPatientName(parsed.patient_name);
    if (parsed.phone) {
      // Whisper/LLM peut renvoyer "06 12 34 56 78", "06-12-34-56-78", "06.12...".
      // On normalise vers 0612345678 pour que la validation passe et que
      // l'user voie un numéro propre.
      a.setPhone(parsed.phone.replace(/[\s\-.()/]/g, ''));
    }
    // Remarques dictees (code immeuble, etage, info patient...) → champ notes
    // du formulaire. Avant : setNotes manquait dans setters → remarques perdues
    // (bug rapporte 2026-05-24).
    if (parsed.notes) a.setNotes(parsed.notes);
    if (parsed.visibility === 'PUBLIC') {
      a.setVisibility('PUBLIC'); a.setGroupIds([]);
    } else if (parsed.visibility === 'GROUP' || parsed.group_names?.length) {
      const matched = matchGroupIds(a.myGroups, parsed.group_names ?? []);
      a.setVisibility('GROUP');
      if (matched.length > 0) a.setGroupIds(matched);
    }
    // Optimistic UI : on applique TOUT DE SUITE le texte brut parsé pour que
    // l'utilisateur voie les champs remplis instantanément. Les lookups Google
    // Places tournent en arrière-plan et raffinent label+coords quand prêts.
    // Le user ne sent plus la latence Places (~1s).
    if (parsed.departure) a.setDeparture(parsed.departure);
    if (parsed.destination) a.setDestination(parsed.destination);

    // Fire-and-forget : pas d'await ici, les Places lookups continuent en async
    // après que `handleAudio` a déjà désactivé isProcessing → la modal disparait
    // dès la fin du LLM, avant que Places finisse.
    void Promise.all([
      parsed.departure ? smartAddressLookup(parsed.departure) : Promise.resolve(null),
      parsed.destination ? smartAddressLookup(parsed.destination) : Promise.resolve(null),
    ]).then(([depMatch, destMatch]) => {
      if (depMatch) {
        a.setDeparture(depMatch.label);
        a.setDepartureCoords({ lat: depMatch.lat, lng: depMatch.lng });
      }
      if (destMatch) {
        a.setDestination(destMatch.label);
        a.setDestinationCoords({ lat: destMatch.lat, lng: destMatch.lng });
      }
    });
  }

  async function handleAudio(audio: { uri: string; type: string }) {
    if (!audio.uri) return;
    setIsProcessing(true);
    setParseError(null);
    try {
      const parsed = await parseVoiceMobile(audio);
      setTranscript(parsed.transcript ?? '');
      await applyParsed(parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erreur IA');
    } finally {
      setIsProcessing(false);
    }
  }

  const recorder = useMobileVoiceRecorder({ onStop: handleAudio });

  return {
    isListening: recorder.isRecording,
    isProcessing,
    transcript,
    error: parseError ?? recorder.error,
    toggle: recorder.toggle,
    start: recorder.start,
    stop: recorder.stop,
  };
}
