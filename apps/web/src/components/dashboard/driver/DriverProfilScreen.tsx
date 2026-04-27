'use client'
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
}

export function DriverProfilScreen({
  driverName,
  onOpenDocuments,
  onOpenInfos,
  onOpenDepartements,
  onOpenBank,
  onOpenInvoices,
  onOpenSupport,
}: Props) {
  const s = useDriverProfilScreen(driverName)

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-bold text-ink leading-tight tracking-tight">
          Profil
        </h1>
      </header>

      <ProfileHeroCard
        fullName={s.fullName}
        initials={s.initials}
        licenseNumber={s.proNumber}
        city={s.city}
        mainDepartement={s.mainDepartement}
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
