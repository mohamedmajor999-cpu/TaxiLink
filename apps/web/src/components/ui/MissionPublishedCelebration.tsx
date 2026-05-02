'use client'

import { useEffect } from 'react'
import { ThumbsUp } from 'lucide-react'

const KEYFRAMES = `
@keyframes published-thumb-pop {
  0%   { transform: rotate(-20deg) scale(0.4); opacity: 0; }
  55%  { transform: rotate(8deg) scale(1.12); opacity: 1; }
  100% { transform: rotate(0deg) scale(1); opacity: 1; }
}
@keyframes published-text-in {
  0%   { transform: translateY(8px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
`

interface Props {
  onDone: () => void
  durationMs?: number
}

/**
 * Plein ecran blanc avec gros pouce vert + "Votre course est publiée — Bravo".
 * Affiche apres une publication reussie pendant `durationMs` ms (2500 par
 * defaut), puis appelle onDone (typiquement: redirection vers le dashboard).
 */
export function MissionPublishedCelebration({ onDone, durationMs = 2500 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, durationMs)
    return () => clearTimeout(timer)
  }, [onDone, durationMs])

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[10000] bg-paper flex flex-col items-center justify-center px-6"
      >
        <div
          className="w-[140px] h-[140px] rounded-full bg-emerald-700 flex items-center justify-center shadow-[0_18px_36px_rgba(4,120,87,0.22),0_0_0_4px_rgba(4,120,87,0.06)]"
          style={{ animation: 'published-thumb-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <ThumbsUp className="w-20 h-20 text-white" strokeWidth={2.4} fill="currentColor" />
        </div>
        <div
          className="mt-8 text-center"
          style={{ animation: 'published-text-in 400ms ease-out 350ms both' }}
        >
          <h2 className="text-[28px] font-black text-ink leading-tight tracking-tight">
            Votre course est publiée
          </h2>
          <p className="mt-2 text-[18px] font-bold text-emerald-700">
            Bravo&nbsp;!
          </p>
        </div>
      </div>
    </>
  )
}
