'use client'
import { useState } from 'react'
import { Mic, X, Check, ArrowRight } from 'lucide-react'
import { RouteTimeline } from '@/components/taxilink/RouteTimeline'

interface Props {
  onClose: () => void
}

export function PartagerMissionModal({ onClose }: Props) {
  const [type, setType] = useState<'CPAM' | 'PRIVE'>('CPAM')
  const [payment, setPayment] = useState<'CPAM' | 'CASH' | 'CB'>('CPAM')
  const [visible, setVisible] = useState<Set<string>>(new Set(['taxi13']))

  const toggleVisible = (k: string) => {
    const next = new Set(visible)
    if (next.has(k)) next.delete(k); else next.add(k)
    setVisible(next)
  }

  return (
    <div className="fixed inset-0 z-50 bg-paper overflow-y-auto">
      <div className="bg-paper w-full min-h-screen">
        <header className="sticky top-0 bg-paper z-10 px-5 py-4 border-b border-warm-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-ink rounded-lg flex items-center justify-center shrink-0">
              <div className="w-3 h-3 bg-brand rounded-sm" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold text-ink leading-tight tracking-tight">Nouvelle course</h2>
              <p className="text-[12px] text-warm-500 mt-0.5 truncate">Dictez ou saisissez manuellement</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" className="h-9 px-3 rounded-lg border border-warm-200 text-ink text-[12px] font-semibold hover:bg-warm-50 transition-colors">
              Brouillon
            </button>
            <button type="button" onClick={onClose} aria-label="Fermer" className="w-9 h-9 rounded-lg bg-warm-100 flex items-center justify-center text-ink hover:bg-warm-200 transition-colors">
              <X className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <div className="px-5 md:px-8 py-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center gap-3 mb-8">
            <div className="relative">
              <span className="absolute -inset-3 rounded-full border-4 border-brand/60" aria-hidden="true" />
              <span className="absolute -inset-1 rounded-full bg-brand/20 blur-sm" aria-hidden="true" />
              <button type="button" aria-label="Dicter" className="relative w-24 h-24 rounded-full bg-ink flex items-center justify-center text-brand hover:bg-warm-800 transition-colors">
                <Mic className="w-9 h-9" strokeWidth={2} />
              </button>
            </div>
            <p className="text-[18px] font-bold text-ink tracking-tight">Parlez, l&apos;IA remplit tout</p>
            <p className="text-[13px] text-warm-500 max-w-xs leading-snug">
              Ex : «&nbsp;Course médicale hôpital Nord depuis La Rose pour 15h30, 38 euros, CPAM&nbsp;»
            </p>
            <div className="flex items-end gap-1 h-6 mt-1" aria-hidden="true">
              {[0.4, 0.7, 0.5, 1, 0.8, 0.3, 0.6].map((h, i) => (
                <span key={i} className={`w-1 rounded-full ${i === 2 || i === 4 ? 'bg-brand' : 'bg-ink'}`} style={{ height: `${h * 100}%` }} />
              ))}
            </div>
          </div>

          <section className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-2">Transcription</h3>
            <div className="rounded-2xl border border-warm-200 bg-warm-50 p-4 text-[14px] text-ink leading-relaxed">
              «&nbsp;Course <HL>médicale</HL> hôpital <HL>Nord</HL> depuis <HL>La Rose</HL> pour <HL>15h30</HL>, <HL>38 euros</HL>, <HL>CPAM</HL>&nbsp;»
            </div>
          </section>

          <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-3">Détails détectés</h3>

          <FieldCard label="Type" filled>
            <div className="flex gap-2">
              <Chip active={type === 'CPAM'} onClick={() => setType('CPAM')}>Médical</Chip>
              <Chip active={type === 'PRIVE'} onClick={() => setType('PRIVE')}>Privé</Chip>
            </div>
          </FieldCard>

          <FieldCard label="Trajet" filled>
            <RouteTimeline
              from={{ name: 'La Rose', address: 'Bd de la Rose, 13013' }}
              to={{ name: 'Hôpital Nord', address: 'Ch. des Bourrely, 13015' }}
            />
          </FieldCard>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <FieldCard label="Heure" filled compact>
              <p className="text-[22px] font-bold text-ink tabular-nums tracking-tight leading-none">15h30</p>
            </FieldCard>
            <FieldCard label="Prix" filled compact>
              <p className="text-[22px] font-bold text-ink tabular-nums tracking-tight leading-none">38€</p>
            </FieldCard>
          </div>

          <FieldCard label="Paiement" filled>
            <div className="flex flex-wrap gap-2">
              <Chip active={payment === 'CPAM'} onClick={() => setPayment('CPAM')}>CPAM</Chip>
              <Chip active={payment === 'CASH'} onClick={() => setPayment('CASH')}>Espèces</Chip>
              <Chip active={payment === 'CB'} onClick={() => setPayment('CB')}>CB</Chip>
            </div>
          </FieldCard>

          <FieldCard label="Visible par">
            <div className="flex flex-wrap gap-2">
              <Chip dot active={visible.has('taxi13')} onClick={() => toggleVisible('taxi13')}>Taxi13</Chip>
              <Chip active={visible.has('allo')} onClick={() => toggleVisible('allo')}>+ Allo Taxi Marseille</Chip>
              <Chip active={visible.has('public')} onClick={() => toggleVisible('public')}>+ Public</Chip>
            </div>
          </FieldCard>

          <button type="button" className="mt-6 w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors">
            Publier la course
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

function HL({ children }: { children: React.ReactNode }) {
  return <span className="bg-brand text-ink px-1.5 py-0.5 rounded font-semibold mx-0.5">{children}</span>
}

function FieldCard({
  label, children, filled = false, compact = false,
}: { label: string; children: React.ReactNode; filled?: boolean; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-warm-200 bg-paper mb-3 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-warm-500">{label}</span>
        {filled && (
          <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
            <Check className="w-3 h-3 text-ink" strokeWidth={2.5} />
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function Chip({
  active, children, onClick, dot = false,
}: { active: boolean; children: React.ReactNode; onClick?: () => void; dot?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ${
        active ? 'bg-ink text-paper' : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
      {active && dot && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
      {children}
    </button>
  )
}
