'use client'
import { Landmark, ReceiptText } from 'lucide-react'
import { ProfileSection } from './ProfileSection'
import { ProfileMenuRow } from './ProfileMenuRow'

interface Props {
  bankAccount: { ibanLast4: string; verified: boolean } | null
  onOpenBank?: () => void
  onOpenInvoices?: () => void
}

export function ProfileSectionPaiements({ bankAccount, onOpenBank, onOpenInvoices }: Props) {
  return (
    <ProfileSection title="Paiements">
      <ProfileMenuRow
        icon={<Landmark className="w-full h-full" strokeWidth={1.8} />}
        label="Compte bancaire"
        description={
          bankAccount ? (
            <span>
              {bankAccount.verified && (
                <span className="text-emerald-600 font-semibold">Vérifié</span>
              )}
              {bankAccount.verified && <span> · </span>}
              <span>IBAN •••{bankAccount.ibanLast4}</span>
            </span>
          ) : (
            'Non configuré'
          )
        }
        onClick={onOpenBank}
      />
      <ProfileMenuRow
        icon={<ReceiptText className="w-full h-full" strokeWidth={1.8} />}
        label="Factures & reçus"
        onClick={onOpenInvoices}
      />
    </ProfileSection>
  )
}
