-- Durcissement de ensure_fleet_group(UUID, UUID)
--
-- Audit 2026-05-04 : la fonction est SECURITY DEFINER et avait
-- GRANT EXECUTE TO authenticated. Cela permettait a tout client
-- authentifie d'appeler ensure_fleet_group(<other_org>, <random_uuid>)
-- et de creer un groupe-flotte au nom d'une org dont il n'est pas membre.
--
-- Surface reelle : creation d'un groupe orphelin (RLS empeche d'y voir les
-- membres ensuite), mais on ferme la porte par principe.
--
-- Strategie :
--   1) REVOKE EXECUTE de authenticated : la fonction ne reste appelable que
--      par postgres (le proprietaire) et indirectement via le trigger
--      sync_fleet_group_on_driver_change qui run en SECURITY DEFINER.
--   2) Defense en profondeur : la fonction verifie que si auth.uid() est
--      non-null (cas d'un appel applicatif), l'appelant est membre de
--      target_org_id. Si l'appel vient du trigger systeme (auth.uid()
--      retourne NULL en contexte serveur), on laisse passer.

BEGIN;

CREATE OR REPLACE FUNCTION ensure_fleet_group(target_org_id UUID, fallback_creator UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_group_id UUID;
  v_org_name TEXT;
  v_caller   UUID;
  v_is_member BOOLEAN;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = target_org_id AND user_id = v_caller
    ) INTO v_is_member;
    IF NOT v_is_member THEN
      RAISE EXCEPTION 'ensure_fleet_group: caller is not a member of target organization'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT id INTO v_group_id FROM groups WHERE fleet_org_id = target_org_id;
  IF v_group_id IS NOT NULL THEN
    RETURN v_group_id;
  END IF;

  SELECT name INTO v_org_name FROM organizations WHERE id = target_org_id;

  INSERT INTO groups (name, description, created_by, fleet_org_id)
  VALUES (
    'Ma flotte — ' || COALESCE(v_org_name, 'Organisation'),
    'Groupe géré automatiquement (synchro avec les chauffeurs de votre flotte). Ajout/retrait manuels désactivés.',
    fallback_creator,
    target_org_id
  )
  RETURNING id INTO v_group_id;

  RETURN v_group_id;
END $$;

-- Retire le GRANT public : seul le trigger systeme et postgres peuvent
-- l'appeler. Aucun appelant applicatif (verifie via grep dans le repo).
REVOKE EXECUTE ON FUNCTION ensure_fleet_group(UUID, UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION ensure_fleet_group(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION ensure_fleet_group(UUID, UUID) FROM PUBLIC;

COMMIT;
