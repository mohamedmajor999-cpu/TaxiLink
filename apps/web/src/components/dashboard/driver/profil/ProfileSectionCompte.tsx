'use client'
import { User, Folder, MapPin, Ban } from 'lucide-react'
import { ProfileSection } from './ProfileSection'
import { ProfileMenuRow } from './ProfileMenuRow'

interface Props {
  email: string
  phone: string
  documentsWarning: string | null
  departements: string[]
  onOpenInfos?: () => void
  onOpenDocuments?: () => void
  onOpenDepartements?: () => void
  onOpenBlocked?: () => void
}

export function ProfileSectionCompte({
  email, phone, documentsWarning, departements,
  onOpenInfos, onOpenDocuments, onOpenDepartements, onOpenBlocked,
}: Props) {
  const infosDescription = [email, phone].filter(Boolean).join(' · ') || 'À compléter'
  const deptsDescription = departements.length > 0
    ? departements.join(' · ')
    : 'Aucun département sélectionné'

  return (
    <ProfileSection title="Compte">
      <ProfileMenuRow
        icon={<User className="w-full h-full" strokeWidth={1.8} />}
        label="Informations personnelles"
        description={infosDescription}
        onClick={onOpenInfos}
      />
      <ProfileMenuRow
        icon={<Folder className="w-full h-full" strokeWidth={1.8} />}
        label="Documents"
        description={
          documentsWarning
            ? <span className="text-danger font-medium">{documentsWarning}</span>
            : 'Tous à jour'
        }
        onClick={onOpenDocuments}
      />
      <ProfileMenuRow
        icon={<MapPin className="w-full h-full" strokeWidth={1.8} />}
        label="Départements couverts"
        description={deptsDescription}
        onClick={onOpenDepartements}
      />
      <ProfileMenuRow
        icon={<Ban className="w-full h-full" strokeWidth={1.8} />}
        label="Chauffeurs bloqués"
        description="Gérer la liste des collègues bloqués"
        onClick={onOpenBlocked}
      />
    </ProfileSection>
  )
}
