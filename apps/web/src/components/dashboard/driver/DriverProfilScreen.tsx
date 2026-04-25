'use client'
import { Settings } from 'lucide-react'
import { useDriverProfilScreen } from './profil/useDriverProfilScreen'
import { ProfileHeroCard } from './profil/ProfileHeroCard'
import { ProfileStatsTiles } from './profil/ProfileStatsTiles'
import { ProfileSectionCompte } from './profil/ProfileSectionCompte'
import { ProfileSectionPaiements } from './profil/ProfileSectionPaiements'
import { ProfileSectionApp } from './profil/ProfileSectionApp'

interface Props {
  driverName: string
  onOpenDocuments?: () => void
  onOpenInfos?: () => void
  onOpenDepartements?: () => void
  onOpenBank?: () => void
  onOpenInvoices?: () => void
  onOpenSupport?: () => void
  onOpenSettings?: () => void
  onEditHero?: () => void
}

export function DriverProfilScreen({
  driverName,
  onOpenDocuments,
  onOpenInfos,
  onOpenDepartements,
  onOpenBank,
  onOpenInvoices,
  onOpenSupport,
  onOpenSettings,
  onEditHero,
}: Props) {
  const s = useDriverProfilScreen(driverName)

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-bold text-ink leading-tight tracking-tight">
          Profil
        </h1>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Réglages"
          className="w-9 h-9 rounded-full grid place-items-center hover:bg-warm-100 transition-colors"
        >
          <Settings className="w-5 h-5 text-warm-700" strokeWidth={1.8} />
        </button>
      </header>

      <ProfileHeroCard
        fullName={s.fullName}
        initials={s.initials}
        licenseNumber={s.proNumber}
        city={s.city}
        mainDepartement={s.mainDepartement}
        onEdit={onEditHero}
      />

      <ProfileStatsTiles
        revenue={s.monthlyRevenue}
        courseCount={s.courseCount}
        rating={s.rating}
      />

      <ProfileSectionCompte
        email={s.email}
        phone={s.phone}
        documentsWarning={s.documentsWarning}
        departements={s.departements}
        onOpenInfos={onOpenInfos}
        onOpenDocuments={onOpenDocuments}
        onOpenDepartements={onOpenDepartements}
      />

      <ProfileSectionPaiements
        bankAccount={null}
        onOpenBank={onOpenBank}
        onOpenInvoices={onOpenInvoices}
      />

      <ProfileSectionApp onOpenSupport={onOpenSupport} />

      <p className="text-center text-[11px] text-warm-500 pt-2 pb-8">
        Version 1.0.0
      </p>
    </div>
  )
}
