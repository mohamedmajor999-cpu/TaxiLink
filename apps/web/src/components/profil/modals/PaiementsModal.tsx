'use client'

import { Icon } from '@/components/ui/Icon'
import { ModalHeader } from './ModalHeader'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { usePaiementsModal } from './usePaiementsModal'

function formatEurAmount(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€'
}

function formatPaidDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function PaiementsModal() {
  const { payments, loading, error, thisMonth, today } = usePaiementsModal()

  const iban = payments[0]?.iban ?? null

  return (
    <div className="pb-8">
      <ModalHeader title="Paiements" />
      <div className="px-5 pt-5 space-y-4">

        {iban && (
          <div className="bg-bgsoft rounded-2xl p-4">
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">IBAN</div>
            <div className="text-sm font-bold text-secondary font-mono">{iban}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-soft p-4">
            <div className="text-2xl font-black text-secondary">{thisMonth.toFixed(0)}€</div>
            <div className="text-xs text-muted mt-1">Ce mois</div>
          </div>
          <div className="bg-secondary rounded-2xl p-4">
            <div className="text-2xl font-black text-primary">{today.toFixed(0)}€</div>
            <div className="text-xs text-white/60 mt-1">Aujourd'hui</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Historique virements</div>
          {loading && <SkeletonLoader count={3} height="h-12" />}
          {error && <ErrorBanner message={error} />}
          {!loading && !error && payments.length === 0 && (
            <p className="text-sm text-muted text-center py-4">Aucun virement pour le moment.</p>
          )}
          {!loading && !error && (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <Icon name="payments" size={16} className="text-muted" />
                    <span className="text-sm text-secondary">{formatPaidDate(p.paid_at ?? p.created_at)}</span>
                  </div>
                  <span className="text-sm font-bold text-secondary">{formatEurAmount(p.amount_eur)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
