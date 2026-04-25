'use client'

import { useEffect } from 'react'
import { ThumbsUp } from 'lucide-react'
import { ConfettiOverlay } from './ConfettiOverlay'

const KEYFRAMES = `
@keyframes celebration-thumb-pop {
  0%   { transform: rotate(-20deg) scale(0.4); opacity: 0; }
  55%  { transform: rotate(8deg) scale(1.12); opacity: 1; }
  100% { transform: rotate(0deg) scale(1); opacity: 1; }
}
@keyframes celebration-text-in {
  0%   { transform: translateY(8px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes celebration-fade-out {
  0%, 75% { opacity: 1; }
  100%    { opacity: 0; }
}
`

export function MissionAcceptedCelebration({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <>
      <style>{KEYFRAMES}</style>
      <ConfettiOverlay onDone={() => { /* géré par ce composant */ }} />
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center pointer-events-none"
        style={{ animation: 'celebration-fade-out 3000ms ease-in both' }}
      >
        <div
          className="w-[120px] h-[120px] rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_12px_36px_rgba(16,185,129,0.45),0_0_0_6px_rgba(16,185,129,0.18)]"
          style={{ animation: 'celebration-thumb-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <ThumbsUp className="w-16 h-16 text-white" strokeWidth={2.4} fill="currentColor" />
        </div>
        <div
          className="mt-6 text-center px-6"
          style={{ animation: 'celebration-text-in 400ms ease-out 350ms both' }}
        >
          <h2
            className="text-[26px] font-black text-brand leading-tight tracking-tight"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)' }}
          >
            Félicitations&nbsp;!
          </h2>
          <p
            className="text-[14px] font-semibold text-paper mt-1"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.5)' }}
          >
            Vous avez accepté une course. Bonne route&nbsp;!
          </p>
        </div>
      </div>
    </>
  )
}
