'use client'

import { ListChecks, Mic, Waves } from 'lucide-react'

export type MissionCreationMode = 'GUIDED' | 'FREE' | 'VOCAL'

interface Props {
  mode: MissionCreationMode
  onChange: (mode: MissionCreationMode) => void
}

export function MissionModeToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full border border-warm-200 bg-paper p-1 text-[12px] font-semibold">
      <ModeButton active={mode === 'GUIDED'} onClick={() => onChange('GUIDED')}>
        <ListChecks className="w-3.5 h-3.5" strokeWidth={2} />
        Guidé
      </ModeButton>
      <ModeButton active={mode === 'FREE'} onClick={() => onChange('FREE')}>
        <Mic className="w-3.5 h-3.5" strokeWidth={2} />
        Semi-libre
      </ModeButton>
      <ModeButton active={mode === 'VOCAL'} onClick={() => onChange('VOCAL')}>
        <Waves className="w-3.5 h-3.5" strokeWidth={2} />
        Mains libres
      </ModeButton>
    </div>
  )
}

function ModeButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full transition-colors ${
        active ? 'bg-ink text-paper' : 'text-warm-600 hover:bg-warm-50'
      }`}
    >
      {children}
    </button>
  )
}
