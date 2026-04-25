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
@keyframes celebration-thumb-fade-out {
  0%, 75% { opacity: 1; }
  100%    { opacity: 0; transform: scale(0.9); }
}
`

export function MissionAcceptedCelebration({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3200)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <>
      <style>{KEYFRAMES}</style>
      <ConfettiOverlay onDone={() => { /* géré par ce composant */ }} />
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
      >
        <div
          className="w-[120px] h-[120px] rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_12px_36px_rgba(16,185,129,0.45),0_0_0_6px_rgba(16,185,129,0.18)]"
          style={{
            animation: 'celebration-thumb-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both, celebration-thumb-fade-out 3200ms ease-in both',
          }}
        >
          <ThumbsUp className="w-16 h-16 text-white" strokeWidth={2.4} fill="currentColor" />
        </div>
      </div>
    </>
  )
}
