'use client'

import { Icon } from '@/components/ui/Icon'
import { PAYMENT_STATUS_MAP, type PaymentStatus } from '@/constants/paymentStatus'
import { formatDateWithYear } from '@/lib/dateUtils'
import { useDriverPayments } from './useDriverPayments'

export function DriverPayments() {
  const {
    payments, loading,
    iban, setIban, savingIban, ibanSaved, savedIban, handleSaveIban,
    totalPaid, totalPending,
  } = useDriverPayments()

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl shadow-soft animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-black text-secondary mb-1">Paiements</h2>
        <p className="text-muted text-sm">Historique de vos virements et revenus</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Total perçu</p>
          <p className="text-3xl font-black text-secondary">{totalPaid.toFixed(2)}€</p>
          <p className="text-xs text-muted mt-1">{payments.filter((p) => p.status === 'paid').length} virements</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">En attente</p>
          <p className="text-3xl font-black text-primary">{totalPending.toFixed(2)}€</p>
          <p className="text-xs text-muted mt-1">{payments.filter((p) => p.status === 'pending').length} en cours</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
        <h3 className="font-bold text-secondary text-lg flex items-center gap-2">
          <Icon name="account_balance" size={20} />
          Coordonnées bancaires
        </h3>
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            IBAN (pour vos virements)
          </label>
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            placeholder="FR76 3000 6000 0112 3456 7890 189"
            className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-mono font-semibold transition-colors tracking-wider"
          />
        </div>
        <button
          onClick={handleSaveIban}
          disabled={savingIban || iban === savedIban}
          className="h-10 px-5 rounded-xl bg-primary font-bold text-secondary text-sm flex items-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingIban
            ? <><Icon name="sync" size={16} className="animate-spin" />Enregistrement...</>
            : ibanSaved
            ? <><Icon name="check_circle" size={16} />Enregistré !</>
            : <><Icon name="save" size={16} />Enregistrer l&apos;IBAN</>}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="font-bold text-secondary text-lg mb-4">Historique des virements</h3>
        {payments.length === 0 ? (
          <div className="text-center py-10">
            <Icon name="payments" size={40} className="text-line mx-auto mb-3 block" />
            <p className="font-semibold text-secondary">Aucun paiement pour le moment</p>
            <p className="text-sm text-muted mt-1">Vos revenus apparaîtront ici après chaque course</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => {
              const s = PAYMENT_STATUS_MAP[p.status as PaymentStatus]
              return (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-line last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bgsoft flex items-center justify-center flex-shrink-0">
                      <Icon
                        name={p.status === 'paid' ? 'check_circle' : p.status === 'pending' ? 'schedule' : 'cancel'}
                        size={18}
                        className={p.status === 'paid' ? 'text-green-600' : p.status === 'pending' ? 'text-yellow-600' : 'text-red-500'}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-secondary">
                        {p.mission_id ? `Course #${p.mission_id.slice(0, 8)}` : 'Virement'}
                      </p>
                      <p className="text-xs text-muted">{formatDateWithYear(p.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-secondary">{p.amount_eur.toFixed(2)}€</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
