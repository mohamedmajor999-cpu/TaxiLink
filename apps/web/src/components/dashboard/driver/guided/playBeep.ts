/**
 * Joue un court bip sonore via Web Audio API pour signaler « à vous ».
 * Retourne une Promise qui se résout à la fin du bip (180 ms).
 */
export function playBeep(): Promise<void> {
  if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in window)) {
    return Promise.resolve()
  }
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0
    osc.connect(gain).connect(ctx.destination)
    const t0 = ctx.currentTime
    gain.gain.linearRampToValueAtTime(0.25, t0 + 0.02)
    gain.gain.linearRampToValueAtTime(0, t0 + 0.18)
    osc.start(t0)
    osc.stop(t0 + 0.2)
    return new Promise((resolve) => {
      osc.onended = () => { ctx.close().catch(() => {}); resolve() }
    })
  } catch {
    return Promise.resolve()
  }
}
