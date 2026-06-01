-- Complement migration 20260601_masked_org_group_read_rpcs : le fil d'activite de
-- groupe (groupActivityService) lit aussi id/departure/destination des courses du
-- groupe, et le bandeau global compte les courses dispo dedupliquees sur PLUSIEURS
-- groupes. On etend get_group_activity_rows (ajout id/departure/destination, retro-
-- compatible) et on ajoute get_groups_available_count(uuid[]).
-- APPLIQUEE EN PROD le 2026-06-01 via MCP (migration 20260601_extend_group_activity_rpcs).

-- get_group_activity_rows : ajout de id, departure, destination (adresses tronquees
-- cote app pour le fil). Toujours AUCUNE PII patient (ni nom, ni tel, ni notes).
DROP FUNCTION IF EXISTS public.get_group_activity_rows(uuid, timestamptz);
CREATE FUNCTION public.get_group_activity_rows(
  p_group_id uuid,
  p_since    timestamptz
)
RETURNS TABLE (
  id          uuid,
  departure   text,
  destination text,
  shared_by   uuid,
  driver_id   uuid,
  created_at  timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.departure, m.destination, m.shared_by, m.driver_id, m.created_at, m.accepted_at
  FROM public.mission_groups mg
  JOIN public.missions m ON m.id = mg.mission_id
  WHERE mg.group_id = p_group_id
    AND m.created_at >= p_since
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = p_group_id AND gm.driver_id = auth.uid()
    );
$$;

-- get_groups_available_count : nombre de courses AVAILABLE dedupliquees sur un
-- ensemble de groupes dont l'appelant est membre (bandeau global). AUCUNE PII.
CREATE OR REPLACE FUNCTION public.get_groups_available_count(
  p_group_ids uuid[]
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(count(DISTINCT mg.mission_id), 0)::integer
  FROM public.mission_groups mg
  JOIN public.missions m ON m.id = mg.mission_id
  WHERE mg.group_id = ANY(p_group_ids)
    AND m.status = 'AVAILABLE'
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = mg.group_id AND gm.driver_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.get_group_activity_rows(uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_groups_available_count(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_group_activity_rows(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_groups_available_count(uuid[]) TO authenticated;
