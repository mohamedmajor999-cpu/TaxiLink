import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';

import { VOICE_RECORDING_OPTIONS } from './voiceRecordingOptions';

interface Options {
  /** Appelé avec une URI locale + type MIME prêts à upload via FormData RN. */
  onStop: (audio: { uri: string; type: string }) => Promise<void> | void;
}

/**
 * Mobile audio recorder wrapping expo-audio. Optimisé pour la dictée vocale
 * en voiture avec kit Bluetooth mains-libres (HFP/SCO) :
 * - Android : `audioSource: 'voice_communication'` route le mic via SCO
 * - iOS : expo-audio insère `.allowBluetoothHFP` dans AVAudioSession dès
 *   `allowsRecording: true` → routage BT auto
 *
 * Le 1er `record()` avec un BT connecté peut prendre 800-1200 ms le temps
 * que l'OS bascule A2DP→HFP. On retente une fois avec un petit délai si
 * `prepareToRecordAsync()` échoue (équivalent du fallback PWA).
 */
export function useMobileVoiceRecorder({ onStop }: Options) {
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
  // Timestamp du dernier `record()`. Sert à rejeter les captures < 1.5s
  // (l'user a juste tapoté le mic, aucun audio exploitable) — Whisper
  // hallucine sur l'audio vide et remplit le formulaire avec du bruit.
  const recordingStartRef = useRef<number | null>(null);

  useEffect(() => {
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => undefined);
  }, []);

  async function prepareWithRetry() {
    try {
      await recorder.prepareToRecordAsync();
    } catch (err) {
      // 1ère tentative KO : l'OS bascule probablement BT A2DP→HFP. On attend
      // ~900 ms puis on retente. Si ça plante toujours, on propage.
      await new Promise((r) => setTimeout(r, 900));
      try {
        await recorder.prepareToRecordAsync();
      } catch {
        throw err;
      }
    }
  }

  async function start() {
    setError(null);
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('permission-denied');
        Alert.alert('Microphone bloqué', 'Autorise l\'accès au micro dans les réglages de l\'application.');
        return;
      }
      await prepareWithRetry();
      recorder.record();
      recordingStartRef.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'mic-error');
      setIsRecording(false);
    }
  }

  async function stop() {
    if (!isRecording) return;
    const startedAt = recordingStartRef.current;
    recordingStartRef.current = null;
    try {
      await recorder.stop();
      setIsRecording(false);
      const durationMs = startedAt ? Date.now() - startedAt : 0;
      // Garde-fou anti-hallucination minimal : appui ultra-court (<0.8s)
      // = tap accidentel, pas une vraie dictée. Whisper s'occupe du reste
      // côté serveur via no_speech_prob (plus fiable que la durée seule).
      if (durationMs < 800) {
        Alert.alert('Trop court', 'Maintiens le micro plus longtemps.');
        setError('too-short');
        return;
      }
      const uri = recorder.uri;
      if (!uri) {
        setError('no-uri');
        return;
      }
      // RN : pas de new File(), on passe l'URI locale directement au FormData
      // via le service partagé qui accepte aussi ce format mobile.
      const type = uri.toLowerCase().endsWith('.mp4') ? 'audio/mp4' : 'audio/m4a';
      await onStopRef.current({ uri, type });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'stop-error');
      setIsRecording(false);
    }
  }

  function toggle() {
    if (isRecording) void stop();
    else void start();
  }

  return { isRecording, error, start, stop, toggle, isSupported: true };
}
