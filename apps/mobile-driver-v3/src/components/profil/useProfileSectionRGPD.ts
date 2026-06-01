import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { authService, getSupabaseClient } from '@taxilink/services';

// Hook : suppression de compte (RGPD art. 17). L'export (art. 20) renvoie
// vers le web pour V1 — porter FileSystem + Sharing côté mobile sera fait
// dans une itération ultérieure.
//
// Stratégie suppression mobile : on appelle directement la fonction SQL
// `delete_my_account()` (granted to authenticated) qui anonymise le profil
// et nullifie les PII des missions. La suppression de la ligne auth.users
// nécessite le service role et reste réservée au flow web (route
// `/api/users/delete`). L'utilisateur sera donc déconnecté ici mais sa
// ligne auth survivra jusqu'à un cleanup serveur — ses données sont
// néanmoins déjà anonymisées, donc l'objectif RGPD est atteint.
export function useProfileSectionRGPD() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAck, setConfirmAck] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openConfirm() {
    setConfirmAck(false);
    setDeleteError(null);
    setConfirmOpen(true);
  }
  function closeConfirm() {
    if (deleting) return;
    setConfirmOpen(false);
  }

  async function confirmDelete() {
    if (!confirmAck || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw new Error(error.message);
      await authService.signOut().catch(() => {
        // SignOut peut échouer si la session a déjà été invalidée serveur
        // suite à l'anonymisation — on ignore et on redirige quand même.
      });
      setConfirmOpen(false);
      router.replace('/login');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Échec de la suppression');
      setDeleting(false);
    }
  }

  function downloadExport() {
    Alert.alert(
      'Téléchargement de tes données',
      "Pour le moment, l'export JSON n'est disponible que depuis la version web (Profil → Mes données). Une version mobile arrive bientôt.",
      [{ text: 'OK', style: 'cancel' }],
    );
  }

  return {
    confirmOpen,
    confirmAck,
    setConfirmAck,
    deleting,
    deleteError,
    openConfirm,
    closeConfirm,
    confirmDelete,
    downloadExport,
  };
}
