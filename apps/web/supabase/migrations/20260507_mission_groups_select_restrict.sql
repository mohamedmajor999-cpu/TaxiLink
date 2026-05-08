-- Restreint la policy SELECT sur mission_groups.
--
-- Avant : USING (true) — tout utilisateur authentifie pouvait cartographier
-- la distribution des missions par groupe (intel concurrentielle, transparence
-- groupes prives). Pas de fuite de motif medical / patient_name (qui sont sur
-- la table missions, deja protegee), mais leak du targeting.
--
-- Apres : un row (mission_id, group_id) n'est visible que si l'utilisateur est
--   1. l'auteur de la mission                  (m.shared_by = auth.uid())
--   2. le client de la mission                 (m.client_id = auth.uid())
--   3. le chauffeur assigne                    (m.driver_id = auth.uid())
--   4. membre du groupe cible                  (gm.driver_id = auth.uid())
--
-- Les routes admin (/api/admin/top-groups, etc.) bypassent RLS via
-- createAdminSupabaseClient() (service_role) — non impactees.
-- La RPC marketplace_masked_rpc est SECURITY DEFINER, non impactee.

DROP POLICY IF EXISTS "mission_groups_select" ON mission_groups;

CREATE POLICY "mission_groups_select"
  ON mission_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_id
        AND (
          m.shared_by = auth.uid()
          OR m.client_id = auth.uid()
          OR m.driver_id = auth.uid()
        )
    )
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = mission_groups.group_id
        AND gm.driver_id = auth.uid()
    )
  );
