-- Bug debug 2026-05-03 dashboard patron : la policy `drivers_select`
-- existante limite la visibilite a (1) son propre profil + (2) les chauffeurs
-- des groupes du user. Resultat : un patron ne voit que les chauffeurs de
-- ses groupes, PAS tous les chauffeurs de son organisation.
--
-- Fix : ajouter une 3e condition OR pour permettre a un membre d'org de
-- voir tous les chauffeurs de cette org. Utilise `current_org_ids()`
-- (SECURITY DEFINER) -> pas de recursion RLS.

BEGIN;

DROP POLICY IF EXISTS "drivers_select" ON drivers;

CREATE POLICY "drivers_select" ON drivers
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR id IN (
      SELECT group_members.driver_id
      FROM group_members
      WHERE group_members.group_id IN (SELECT get_my_group_ids() AS get_my_group_ids)
    )
    OR organization_id IN (SELECT current_org_ids())
  );

COMMIT;
