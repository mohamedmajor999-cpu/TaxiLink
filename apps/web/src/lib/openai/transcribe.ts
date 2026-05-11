// Helper Whisper : transcrit un fichier audio en français avec biais marseillais.

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'
const TIMEOUT_MS = 30000

const WHISPER_PROMPT =
  'Course en taxi a Marseille et Bouches-du-Rhone. ' +
  'Quartiers : Frais Vallon, La Castellane, La Rose, Saint-Antoine, La Joliette, ' +
  'Castellane, Bonneveine, La Timone, La Conception, Endoume, Saint-Loup, Mazargues, ' +
  'Le Panier, Sainte-Marguerite, Les Caillols, Saint-Just, Saint-Jerome. ' +
  'Hopitaux : La Timone, La Conception, Hopital Nord, Hopital Europeen, ' +
  'Saint-Joseph, Sainte-Marguerite, Clairval, Beauregard, Desbief. ' +
  'Reperes : Gare Saint-Charles, Aeroport Marseille Provence, Vieux-Port, ' +
  'Stade Velodrome, Stade Frais Vallon, Plage du Prado. ' +
  'Villes : Aix-en-Provence, Aubagne, Marignane, Vitrolles, Martigues, ' +
  'Salon-de-Provence, Cassis, La Ciotat, Allauch, Plan-de-Cuques. ' +
  'Termes : CPAM, dialyse, consultation, hopital de jour, kine, radio, scanner, IRM.'

export interface TranscribeResult {
  text: string
  elapsedMs: number
  // Duree audio en secondes, telle que Whisper l'a calculee. Utilisee par
  // logAiUsage pour facturer ($0.006/min). null si Whisper ne l'a pas renvoye.
  audioSeconds: number | null
}

export class TranscribeError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function transcribeAudio(audio: File, apiKey: string): Promise<TranscribeResult> {
  const form = new FormData()
  form.append('file', audio, audio.name || 'audio.webm')
  form.append('model', 'whisper-1')
  form.append('language', 'fr')
  // verbose_json : Whisper renvoie aussi le champ `duration` (secondes audio)
  // dont on a besoin pour facturer correctement dans ai_usage.
  form.append('response_format', 'verbose_json')
  form.append('prompt', WHISPER_PROMPT)

  const start = Date.now()
  let res: Response
  try {
    res = await fetch(WHISPER_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    const isTimeout = (err as Error).name === 'TimeoutError' || (err as Error).name === 'AbortError'
    throw new TranscribeError(isTimeout ? 504 : 502, isTimeout ? 'Délai Whisper dépassé' : 'Erreur réseau Whisper')
  }

  const elapsedMs = Date.now() - start
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[whisper] ${res.status} in ${elapsedMs}ms`, body.slice(0, 300))
    throw new TranscribeError(res.status, `Whisper ${res.status}`)
  }

  const json = (await res.json()) as { text?: string; duration?: number }
  const audioSeconds = typeof json.duration === 'number' ? json.duration : null
  return { text: (json.text ?? '').trim(), elapsedMs, audioSeconds }
}
