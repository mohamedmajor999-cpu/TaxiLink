import type { RecordingOptions } from 'expo-audio';
import { AudioQuality, IOSOutputFormat } from 'expo-audio';

/**
 * Options optimisées pour la dictée vocale en voiture (kit mains-libres Bluetooth)
 * et transcription Whisper.
 *
 * **Pourquoi 16 kHz mono ?**
 * - Whisper downsample tout en 16 kHz en interne → enregistrer plus haut est inutile
 * - HFP/SCO (profil Bluetooth voiture) plafonne à 16 kHz mono → si on demande plus,
 *   Android/iOS downmixent ou refusent, et on rate le micro voiture
 * - Fichier ~3-4× plus petit qu'en 44 kHz stéréo → upload plus rapide
 *
 * **`audioSource: 'voice_communication'` sur Android** (MediaRecorder.AudioSource.VOICE_COMMUNICATION) :
 * - Route automatiquement le micro via SCO si un kit BT HFP est connecté
 * - Active AEC (echo cancellation), AGC (auto gain), NS (noise suppression) côté OS
 * - C'est la source recommandée par Google pour toute app de voix/dictée
 *
 * **iOS** : expo-audio insère déjà `.allowBluetoothHFP` dans AVAudioSession quand
 * `allowsRecording: true` est passé à `setAudioModeAsync` → le routage BT marche
 * tout seul, pas besoin d'option côté ios ici.
 */
export const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    // 'voice_communication' provoquait un crash natif sur certains devices
    // Android (notamment avec New Architecture activee, build 2026-05-23).
    // Le source 'mic' (defaut) fonctionne partout ; le routage HFP BT
    // continue de marcher via setAudioModeAsync({ allowsRecording: true }).
    audioSource: 'mic',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 32000,
  },
};
