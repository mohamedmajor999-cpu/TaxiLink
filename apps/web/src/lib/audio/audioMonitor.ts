// Monitor un MediaStream audio pendant l'enregistrement pour detecter le
// silence. Whisper hallucine sur les audios silencieux (ex: "Merci d'avoir
// regarde", "Sous-titres realises par..."), donc on bloque avant l'envoi.
//
// peakLevel() retourne l'amplitude max [0..1] observee depuis le start. On
// echantillonne toutes les 100ms en time-domain (Float32) pour eviter le
// cout de FFT inutile ici.

const SAMPLE_INTERVAL_MS = 100

export interface AudioMonitor {
  peakLevel: () => number
  stop: () => void
}

export function createAudioMonitor(stream: MediaStream): AudioMonitor | null {
  const Ctx = typeof window !== 'undefined'
    ? (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
    : null
  if (!Ctx) return null

  let peak = 0
  const ctx = new Ctx()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  source.connect(analyser)
  const buf = new Float32Array(analyser.fftSize)

  const interval = window.setInterval(() => {
    analyser.getFloatTimeDomainData(buf)
    let max = 0
    for (let i = 0; i < buf.length; i++) {
      const v = Math.abs(buf[i])
      if (v > max) max = v
    }
    if (max > peak) peak = max
  }, SAMPLE_INTERVAL_MS)

  return {
    peakLevel: () => peak,
    stop: () => {
      window.clearInterval(interval)
      source.disconnect()
      void ctx.close().catch(() => undefined)
    },
  }
}

// Seuils par defaut. 1200ms est assez court pour ne pas froisser un chauffeur
// qui dicte vite, et 0.02 (-34 dBFS) est au-dessus du bruit ambiant typique
// d'une voiture moteur tournant mais en dessous d'une voix murmuree.
export const MIN_RECORDING_MS = 1200
export const MIN_PEAK_LEVEL = 0.02

export function isAudioSilent(durationMs: number, peakLevel: number): boolean {
  return durationMs < MIN_RECORDING_MS || peakLevel < MIN_PEAK_LEVEL
}
