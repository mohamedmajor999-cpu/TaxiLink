'use client'
import type { ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'

export function Chip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-3.5 rounded-full border flex items-center gap-1.5 text-[12.5px] font-bold transition-colors ${
        active ? 'bg-ink border-ink text-paper' : 'bg-transparent border-warm-200 text-warm-500 hover:border-warm-400 hover:text-ink'
      }`}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  )
}

export function FieldRow({ leadIcon, trail, children }: { leadIcon: ReactNode; trail?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[24px_1fr_auto] gap-3.5 items-center py-4 border-b border-warm-200 min-h-[64px]">
      <div className="flex items-center justify-center text-warm-500">{leadIcon}</div>
      <div className="min-w-0">{children}</div>
      <div className="flex items-center gap-1.5">{trail}</div>
    </div>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-bold tracking-[0.04em] uppercase text-warm-400 mb-0.5">{children}</div>
}

export function FieldInput({
  value, onChange, placeholder, type = 'text', inputMode, autoComplete,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: 'tel' | 'text' | 'numeric' | 'email' | 'search' | 'url' | 'none' | 'decimal'
  autoComplete?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete={autoComplete}
      className="w-full bg-transparent border-0 outline-none text-[16px] font-bold tracking-[-0.012em] text-ink placeholder:text-warm-400 placeholder:font-semibold"
    />
  )
}

export function MicBtn({ active, onClick, ariaLabel = 'Dicter' }: { active?: boolean; onClick?: () => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center text-ink transition-colors ${
        active ? 'bg-brand' : 'bg-warm-100 hover:bg-brand'
      }`}
    >
      {active && <span className="absolute inset-0 rounded-full bg-brand/40 animate-ping" />}
      <Icon name="mic" size={18} className="relative" />
    </button>
  )
}

export function WhenPill({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3.5 rounded-full border flex items-center gap-1 text-[12.5px] font-bold transition-colors ${
        active ? 'bg-brand border-brand text-ink' : 'bg-transparent border-warm-200 text-warm-500'
      }`}
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  )
}

export function MicroLabel({ children }: { children: ReactNode }) {
  return <span className="block text-[11px] font-bold tracking-[0.04em] uppercase text-warm-500 mb-1.5">{children}</span>
}

export function SegMini({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-1 bg-white/60 border border-black/[0.06] rounded-[11px] p-[3px]">{children}</div>
}

export function SegMiniBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-[34px] rounded-lg text-[12.5px] font-bold transition-colors ${active ? 'bg-ink text-brand' : 'bg-transparent text-warm-500'}`}
    >
      {children}
    </button>
  )
}

export function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center h-10 bg-white/60 border border-black/[0.06] rounded-[11px] px-1">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-8 h-8 rounded-lg hover:bg-black/[0.05] text-warm-700 text-[16px] font-bold"
        aria-label="Moins"
      >−</button>
      <span className="flex-1 text-center text-[14.5px] font-extrabold" style={{ fontFeatureSettings: '"tnum"' }}>{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-lg hover:bg-black/[0.05] text-warm-700 text-[16px] font-bold"
        aria-label="Plus"
      >+</button>
    </div>
  )
}

export function VisBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-[10px] flex items-center justify-center gap-1.5 text-[13px] font-bold transition-shadow ${
        active ? 'bg-paper text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]' : 'bg-transparent text-warm-500'
      }`}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  )
}

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className={`w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors ${
      checked ? 'bg-ink border-ink' : 'border-warm-400 bg-white/60'
    }`}>
      {checked && <Icon name="check" size={14} className="text-brand" />}
    </span>
  )
}
