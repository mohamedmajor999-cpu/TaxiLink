import { getSupabaseClient } from '@taxilink/services';
import type { ParsedMissionFields } from '@taxilink/services';

type AudioInput = { uri: string; type?: string };

function buildForm(audio: AudioInput, mode?: 'address'): FormData {
  const type = audio.type || 'audio/m4a';
  const ext = type.includes('mp4') ? 'mp4' : type.includes('m4a') ? 'm4a' : 'webm';
  const form = new FormData();
  form.append('audio', { uri: audio.uri, type, name: `audio.${ext}` } as never);
  if (mode) form.append('mode', mode);
  return form;
}

async function extractError(error: { message?: string; context?: unknown }): Promise<string> {
  let msg = error.message || 'Erreur Edge Function';
  if (error.context instanceof Response) {
    try {
      const txt = await error.context.text();
      try {
        const json = JSON.parse(txt);
        if (json?.error) msg = json.error;
        else if (txt) msg = txt.slice(0, 300);
      } catch {
        if (txt) msg = txt.slice(0, 300);
      }
    } catch { /* ignore */ }
  }
  return msg;
}

/**
 * Mode "full" : Whisper + GPT-4o-mini → extrait tous les champs de la course
 * (type, adresses, heure, prix, etc.). Utilisé par le gros mic principal.
 */
export async function parseVoiceMobile(audio: AudioInput): Promise<ParsedMissionFields> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<ParsedMissionFields>('parse-voice', {
    body: buildForm(audio),
  });
  if (error) throw new Error(await extractError(error));
  if (!data) throw new Error('Réponse vide');
  return data;
}

/**
 * Mode "address" : Whisper SEUL → renvoie juste le transcript pour qu'il
 * serve de texte d'adresse brut (l'app résout ensuite via Google Places).
 * Plus rapide (pas d'appel GPT) et moins cher.
 */
export async function transcribeAddressMobile(audio: AudioInput): Promise<{ transcript: string }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<{ transcript: string }>('parse-voice', {
    body: buildForm(audio, 'address'),
  });
  if (error) throw new Error(await extractError(error));
  if (!data?.transcript) throw new Error('Transcription vide');
  return data;
}
