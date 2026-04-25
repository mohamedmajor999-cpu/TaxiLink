'use client'
import { Pencil } from 'lucide-react'

interface Props {
  fullName: string
  initials: string
  licenseNumber?: string | null
  city?: string | null
  mainDepartement?: string | null
  onEdit?: () => void
}

export function ProfileHeroCard({
  fullName, initials, licenseNumber, city, mainDepartement, onEdit,
}: Props) {
  const subtitleLine1 = ['Chauffeur taxi', licenseNumber ? `Licence n° ${licenseNumber}` : null]
    .filter(Boolean)
    .join(' · ')
  const subtitleLine2 = [city, mainDepartement].filter(Boolean).join(' · ')

  return (
    <section className="relative bg-brand rounded-3xl px-5 py-5 mb-5 overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="w-[72px] h-[72px] rounded-full bg-ink text-paper grid place-items-center text-[22px] font-semibold tracking-tight shrink-0 border-[3px] border-paper">
          {initials}
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <h2 className="text-[19px] font-bold text-ink leading-tight tracking-tight truncate">
            {fullName}
          </h2>
          {subtitleLine1 && (
            <p className="text-[12.5px] text-ink/75 mt-1 leading-snug">
              {subtitleLine1}
            </p>
          )}
          {subtitleLine2 && (
            <p className="text-[12.5px] text-ink/75 leading-snug">
              {subtitleLine2}
            </p>
          )}
        </div>
      </div>

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Modifier le profil"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-ink/10 hover:bg-ink/20 grid place-items-center transition-colors"
        >
          <Pencil className="w-4 h-4 text-ink" strokeWidth={2} />
        </button>
      )}
    </section>
  )
}
