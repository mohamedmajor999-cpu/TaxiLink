'use client'

import { Icon } from '@/components/ui/Icon'
import { ModalHeader } from './ModalHeader'

const virements = [
  { date: '31 mars 2026', amount: '1 284,00€' },
  { date: '28 fév. 2026', amount: '1 156,50€' },
  { date: '31 jan. 2026', amount: '1 342,00€' },
]

export function PaiementsModal() {
  return (
    <div className="pb-8">
      <ModalHeader title="Paiements" />
      <div className="px-5 pt-5 space-y-4">
        <div className="bg-bgsoft rounded-2xl p-4">
          <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">IBAN</div>
          <div className="text-sm font-bold text-secondary font-mono">FR76 3000 6000 0112 3456 7890 189</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-soft p-4">
            <div className="text-2xl font-black text-secondary">1 284€</div>
            <div className="text-xs text-muted mt-1">Ce mois</div>
          </div>
          <div className="bg-secondary rounded-2xl p-4">
            <div className="text-2xl font-black text-primary">187€</div>
            <div className="text-xs text-white/60 mt-1">Aujourd'hui</div>
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Historique virements</div>
          <div className="space-y-2">
            {virements.map((v) => (
              <div key={v.date} className="flex items-center justify-between py-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Icon name="payments" size={16} className="text-muted" />
                  <span className="text-sm text-secondary">{v.date}</span>
                </div>
                <span className="text-sm font-bold text-secondary">{v.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
