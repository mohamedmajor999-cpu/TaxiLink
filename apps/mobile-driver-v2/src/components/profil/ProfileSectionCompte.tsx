import { ProfileMenuRow } from './ProfileMenuRow';
import { ProfileSection } from './ProfileSection';

interface Props {
  email: string;
  phone: string;
  documentsWarning: string | null;
  departements: string[];
  onOpenInfos?: () => void;
  onOpenDocuments?: () => void;
  onOpenDepartements?: () => void;
  onOpenBlocked?: () => void;
}

export function ProfileSectionCompte({
  email,
  phone,
  documentsWarning,
  departements,
  onOpenInfos,
  onOpenDocuments,
  onOpenDepartements,
  onOpenBlocked,
}: Props) {
  const infosDescription = [email, phone].filter(Boolean).join(' · ') || 'À compléter';
  const deptsDescription =
    departements.length > 0 ? departements.join(' · ') : 'Aucun département sélectionné';

  return (
    <ProfileSection title="Compte">
      <ProfileMenuRow
        icon="user"
        label="Informations personnelles"
        description={infosDescription}
        onPress={onOpenInfos}
      />
      <ProfileMenuRow
        icon="folder"
        label="Documents"
        description={documentsWarning ?? 'Tous à jour'}
        descriptionWarning={!!documentsWarning}
        onPress={onOpenDocuments}
      />
      <ProfileMenuRow
        icon="map-pin"
        label="Départements couverts"
        description={deptsDescription}
        onPress={onOpenDepartements}
      />
      <ProfileMenuRow
        icon="ban"
        label="Chauffeurs bloqués"
        description="Gérer la liste des collègues bloqués"
        onPress={onOpenBlocked}
      />
    </ProfileSection>
  );
}
