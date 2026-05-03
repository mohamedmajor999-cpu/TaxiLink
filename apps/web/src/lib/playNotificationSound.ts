/**
 * Son de notification ("ding-dong" deux tons) via Web Audio API.
 * Singleton AudioContext + "unlock" au premier geste utilisateur : une fois
 * appele, `armNotificationAudio()` debloque l'audio pour toute la session,
 * meme si l'evenement de notification arrive sans geste utilisateur direct
 * (ex : push realtime). Sans cela, les navigateurs bloqueraient le 1er son.
 */

let ctx: AudioContext | null = null
let armed = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) {
    try { ctx = new Ctor() } catch { return null }
  }
  return ctx
}

/**
 * A appeler une fois au montage du dashboard. Pose des listeners one-shot
 * sur le document : au premier click/touch/keydown, l'AudioContext est
 * resume et reste utilisable pour toutes les notifications suivantes.
 */
export function armNotificationAudio(): () => void {
  if (typeof window === 'undefined' || armed) return () => {}
  armed = true
  const unlock = () => {
    const c = getCtx()
    if (c && c.state === 'suspended') c.resume().catch(() => {})
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
    window.removeEventListener('touchstart', unlock)
  }
  window.addEventListener('pointerdown', unlock, { once: true, passive: true })
  window.addEventListener('keydown', unlock, { once: true })
  window.addEventListener('touchstart', unlock, { once: true, passive: true })
  return () => {
    armed = false
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
    window.removeEventListener('touchstart', unlock)
  }
}

export function playNotificationSound(): void {
  const c = getCtx()
  if (!c) return
  try {
    if (c.state === 'suspended') c.resume().catch(() => {})
    const t0 = c.currentTime
    playTone(c, 880, t0, 0.18)
    playTone(c, 660, t0 + 0.16, 0.22)
  } catch { /* silencieux */ }
}

function playTone(c: AudioContext, freq: number, startAt: number, duration: number): void {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(0.28, startAt + 0.02)
  gain.gain.linearRampToValueAtTime(0, startAt + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.02)
}
