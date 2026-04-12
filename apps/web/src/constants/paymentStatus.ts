export type PaymentStatus = 'paid' | 'pending' | 'failed'

export const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; className: string }> = {
  paid:    { label: 'Payé',       className: 'bg-green-100 text-green-700' },
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
  failed:  { label: 'Échoué',     className: 'bg-red-100 text-red-600' },
}
