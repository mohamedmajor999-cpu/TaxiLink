'use client'

import { useEffect } from 'react'
import { ThumbsUp } from 'lucide-react'
import { ConfettiOverlay } from './ConfettiOverlay'

const KEYFRAMES = `
@keyframes celebration-pop {
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes celebration-thumb {
  0%   { transform: rotate(-20deg) scale(0.5); }
  50%  { transform: rotate(10deg) scale(1.15); }
  100% { transform: rotate(0deg) scale(1); }
}
@keyframes celebration-fade-out {
  0%, 80% { opacity: 1; }
  100%    { opacity: 0; }
}
`

export function MissionAcceptedCelebration({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <>
      <style>{KEYFRAMES}</style>
      <ConfettiOverlay onDone={() => { /* geré par ce composant */ }} />
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-6"
      >
        <div
          className="pointer-events-auto bg-paper rounded-3xl shadow-2xl border border-warm-200 px-8 py-7 flex flex-col items-center text-center max-w-sm w-full"
          style={{
            animation: 'celebration-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both, celebration-fade-out 2800ms ease-in both',
          }}
        >
          <div
            className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4"
            style={{ animation: 'celebration-thumb 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 120ms both' }}
          >
            <ThumbsUp className="w-9 h-9 text-emerald-600" strokeWidth={2} />
          </div>
          <h2 className="text-[22px] font-bold text-ink leading-tight tracking-tight">
            Félicitations&nbsp;!
          </h2>
          <p className="text-[14px] text-warm-600 mt-1.5">
            Vous avez accepté une course
          </p>
        </div>
      </div>
    </>
  )
}
