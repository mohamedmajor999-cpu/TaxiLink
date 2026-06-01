import { ProfileMenuRow } from './ProfileMenuRow';
import { ProfileSection } from './ProfileSection';

interface Props {
  email: string;
  phone: string;
  documentsWarning: string | null;
  departements: string[];
  onOpenInfos?: () => void;
  onOpenStats?: () => void;
  onOpenHistory?: () => void;
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
  onOpenStats,
  onOpenHistory,
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
        icon="trending-up"
        label="Mes statistiques"
        description="Gains, courses, sparkline 7 jours"
        onPress={onOpenStats}
      />
      <ProfileMenuRow
        icon="clock"
        label="Historique des courses"
        description="Tes courses terminées, jour par jour"
        onPress={onOpenHistory}
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
