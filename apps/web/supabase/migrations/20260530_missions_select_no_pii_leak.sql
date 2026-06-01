-- P0-2 (fuite PII patient / risque CNIL) : la policy SELECT chauffeur autorisait
-- la lecture LIGNE COMPLETE de TOUTE mission AVAILABLE → n'importe quel chauffeur
-- authentifie pouvait lire nom/telephone/notes patient en base (PostgREST direct),
-- en contournant le masquage applique cote ecran.
--
-- Fix : retirer la branche "status = 'AVAILABLE'" (lecture complete pour tous) et
-- la remplacer par les seuls acces legitimes : ses propres courses (driver_id),
-- ses propres courses cliente (client_id), et ses propres annonces postees
-- (shared_by — AJOUTE, sinon le posteur ne verrait plus ses annonces AVAILABLE).
-- L'apercu "avant acceptation" passe deja par les RPC masques cote serveur
-- (get_marketplace_missions pour le feed, get_mission_detail pour le detail), qui
-- sont SECURITY DEFINER et masquent la PII — ils ne sont donc PAS affectes.
--
-- NE PAS APPLIQUER A L'AVEUGLE. Verifications obligatoires (outil base requis) :
--   1) Confirmer le nom exact + la definition de la policy SELECT actuelle :
--      select policyname, qual from pg_policies
--      where tablename='missions' and cmd='SELECT';
--   2) Confirmer qu'il existe une policy SEPAREE pour patron/admin (lecture des
--      courses d'organisation), sinon leurs dashboards lisent via cette policy →
--      a adapter. (Les lectures patron/admin/page-publique connues passent par
--      service_role ou organization_id, donc a priori non impactees.)
--   3) Confirmer que le detail cote SITE chauffeur passe par get_mission_detail
--      (RPC masque) et non par un SELECT direct d'une mission AVAILABLE non possedee.
--
-- Le nom ci-dessous correspond a l'audit ("Lecture missions disponibles") ; a
-- confirmer en (1) avant d'appliquer.

DROP POLICY IF EXISTS "Lecture missions disponibles" ON public.missions;

CREATE POLICY "Lecture missions disponibles" ON public.missions
  FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid()
    OR client_id = auth.uid()
    OR shared_by = auth.uid()
  );
