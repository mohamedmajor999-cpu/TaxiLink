import { useState } from 'react';
import { searchGoogle, resolveGooglePlace, findKnownPlaceMarseille } from '@taxilink/services';

import { useMobileVoiceRecorder } from './useMobileVoiceRecorder';
import { transcribeAddressMobile } from './mobileVoiceParseService';

// Centre approximatif de Marseille — sert de bias géographique aux requêtes
// Google Places quand on n'a pas la position GPS du chauffeur. Réduit les
// résultats hors-zone (Whisper transcrit parfois "Marseille" en "Mars",
// la bias évite que Google propose la planète ou Mars-la-Tour).
const MARSEILLE_BIAS = { lat: 43.2965, lng: 5.3698 };

interface Options {
  /** Met à jour le texte brut du champ (ex: pendant que Google Places résout). */
  onChangeText: (text: string) => void;
  /** Notifie le parent quand on a résolu label + lat + lng via Google Places. */
  onSelectSuggestion: (s: { label: string; lat: number; lng: number }) => void;
  /** Appelé au début de l'enregistrement (pas à l'arrêt). Permet au parent
   *  d'effacer l'ancienne adresse + coords pour repartir de zéro — sinon
   *  l'user voit l'ancienne adresse jusqu'à ce que Whisper finisse. */
  onStart?: () => void;
}

/**
 * Dictée vocale par champ d'adresse :
 * - Record audio (16 kHz mono via expo-audio + BT SCO si dispo)
 * - Whisper transcript (Edge Function parse-voice, mode='address')
 * - Résolution Google Places sur le transcript pour récupérer coords
 *
 * Pendant que la résolution Places tourne, on affiche déjà le transcript dans
 * le champ → feedback immédiat même si Places tarde 200-300 ms.
 */
export function useFieldAddressVoice({ onChangeText, onSelectSuggestion, onStart }: Options) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAudio(audio: { uri: string; type: string }) {
    if (!audio.uri) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { transcript } = await transcribeAddressMobile(audio);
      onChangeText(transcript);

      // Étape 1 : banque locale dept 13 (~100 lieux). 2 cas :
      // - `coords` présent → match direct, zéro appel API, instantané.
      // - `coords` absent → on a juste un label canonique propre qu'on envoie
      //   à Google à la place du transcript brut Whisper (plus fiable).
      const known = findKnownPlaceMarseille(transcript);
      if (known?.coords) {
        onChangeText(known.label);
        onSelectSuggestion({ label: known.label, lat: known.coords.lat, lng: known.coords.lng });
        return;
      }
      const baseQuery = known?.label ?? transcript;

      // Étape 2 : Google Places avec 2 variantes en cascade.
      // - 1ère : query directe (avec bias Marseille pour éviter homonymes).
      // - 2ème : query + ", Bouches-du-Rhône" si la 1ère ne renvoie rien.
      // Pas de pénalité de latence dans 90% des cas — la 1ère trouve direct.
      const queries = [baseQuery, `${baseQuery}, Bouches-du-Rhône`];
      let first: { label: string; lat: number; lng: number; placeId?: string } | undefined;
      for (const q of queries) {
        const sugg = await searchGoogle(q, undefined, MARSEILLE_BIAS).catch(() => []);
        if (sugg[0]) { first = sugg[0]; break; }
      }
      if (!first) return;
      // searchGoogle renvoie lat=0, lng=0 comme placeholders → toujours resolveGooglePlace.
      if ((first.lat !== 0 || first.lng !== 0) && typeof first.lat === 'number' && typeof first.lng === 'number') {
        onChangeText(first.label);
        onSelectSuggestion({ label: first.label, lat: first.lat, lng: first.lng });
        return;
      }
      if (!first.placeId) return;
      const details = await resolveGooglePlace(first.placeId);
      if (details) {
        onChangeText(first.label);
        onSelectSuggestion({ label: first.label, lat: details.lat, lng: details.lng });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur dictée');
    } finally {
      setIsProcessing(false);
    }
  }

  const recorder = useMobileVoiceRecorder({ onStop: handleAudio });

  // Wrapper qui notifie onStart() avant de démarrer (pas avant d'arrêter).
  // Le parent en profite pour vider l'ancienne adresse + coords AVANT que
  // Whisper renvoie un transcript — UX plus claire pendant les 2-3s d'attente.
  const toggle = () => {
    if (!recorder.isRecording) onStart?.();
    recorder.toggle();
  };

  return {
    isListening: recorder.isRecording,
    isProcessing,
    error: error ?? recorder.error,
    toggle,
  };
}
