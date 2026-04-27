'use client'
import { ArrowLeft, ReceiptText, Printer, X } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { formatEur } from '@/lib/formatters'
import { formatDateShort, formatTime } from '@/lib/dateUtils'
import { useDriverStore } from '@/store/driverStore'
import { useInvoicesScreen, type MonthGroup } from './useInvoicesScreen'
import { InvoiceReceipt } from './InvoiceReceipt'

interface Props {
  onBack: () => void
}

export function InvoicesScreen({ onBack }: Props) {
  const s = useInvoicesScreen()
  const { driver } = useDriverStore()

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-5 print-hide">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="w-9 h-9 rounded-full grid place-items-center hover:bg-warm-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
            Factures &amp; reçus
          </h1>
          {!s.loading && (
            <p className="text-[12.5px] text-warm-500 mt-0.5">
              {new Date().getFullYear()} : {formatEur(s.yearTotal)}
            </p>
          )}
        </div>
      </header>

      {s.error && (
        <div className="bg-danger-soft text-danger text-[12px] px-3 py-2 rounded-xl mb-4">
          {s.error}
        </div>
      )}

      {s.loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-warm-100 animate-pulse" />
          ))}
        </div>
      ) : s.groups.length === 0 ? (
        <div className="bg-paper border border-warm-200 rounded-2xl p-8 text-center">
          <ReceiptText className="w-8 h-8 mx-auto text-warm-400 mb-2" strokeWidth={1.5} />
          <p className="text-[13px] font-semibold text-ink">Aucune course terminée</p>
          <p className="text-[12px] text-warm-500 mt-1">Tes reçus apparaîtront ici.</p>
        </div>
      ) : (
        s.groups.map((g) => <MonthSection key={g.key} group={g} onOpen={s.openMission} />)
      )}

      {s.selectedMission && (
        <ReceiptModal
          mission={s.selectedMission}
          driverName={driver.name || 'Chauffeur'}
          driverPhone={driver.phone ?? null}
          proNumber={null}
          onClose={s.closeMission}
          onPrint={s.print}
        />
      )}
    </div>
  )
}

function MonthSection({ group, onOpen }: { group: MonthGroup; onOpen: (id: string) => void }) {
  return (
    <section className="mb-5 print-hide">
      <div className="flex items-baseline justify-between px-1 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500">
          {group.label}
        </p>
        <p className="text-[12px] font-semibold text-ink tabular-nums">{formatEur(group.total)}</p>
      </div>
      <div className="flex flex-col gap-2">
        {group.missions.map((m) => (
          <InvoiceRow key={m.id} mission={m} onClick={() => onOpen(m.id)} />
        ))}
      </div>
    </section>
  )
}

function InvoiceRow({ mission, onClick }: { mission: Mission; onClick: () => void }) {
  const date = mission.completed_at ?? mission.scheduled_at
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border bg-paper border-warm-200 hover:bg-warm-50 transition-colors text-left"
    >
      <span className="w-9 h-9 rounded-xl bg-warm-100 text-warm-800 grid place-items-center shrink-0">
        <ReceiptText className="w-[18px] h-[18px]" strokeWidth={1.8} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink leading-tight truncate">
          {mission.departure} → {mission.destination}
        </div>
        <div className="text-[11.5px] text-warm-500 mt-0.5">
          {formatDateShort(date)} · {formatTime(date)}
          {mission.type && <> · {mission.type}</>}
        </div>
      </div>
      <span className="text-[14px] font-semibold text-ink tabular-nums shrink-0">
        {formatEur(Number(mission.price_eur ?? 0))}
      </span>
    </button>
  )
}

function ReceiptModal({
  mission, driverName, driverPhone, proNumber, onClose, onPrint,
}: {
  mission: Mission
  driverName: string
  driverPhone: string | null
  proNumber: string | null
  onClose: () => void
  onPrint: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-paper rounded-t-3xl md:rounded-3xl w-full md:max-w-xl max-h-[90vh] overflow-y-auto shadow-toast">
        <header className="sticky top-0 bg-paper flex items-center justify-between px-5 py-3 border-b border-warm-200 print-hide">
          <h2 className="text-[15px] font-semibold text-ink">Reçu</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="h-9 px-3 rounded-xl bg-ink text-paper text-[12.5px] font-semibold inline-flex items-center gap-1.5 hover:bg-ink/90 transition-colors"
            >
              <Printer className="w-4 h-4" strokeWidth={2} />
              Imprimer / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-9 h-9 rounded-full grid place-items-center hover:bg-warm-100 transition-colors"
            >
              <X className="w-5 h-5 text-ink" strokeWidth={2} />
            </button>
          </div>
        </header>
        <div className="p-5">
          <InvoiceReceipt
            mission={mission}
            driverName={driverName}
            driverPhone={driverPhone}
            proNumber={proNumber}
          />
        </div>
      </div>
    </div>
  )
}
