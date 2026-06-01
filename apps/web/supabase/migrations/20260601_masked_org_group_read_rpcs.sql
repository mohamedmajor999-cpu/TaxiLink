-- P0 fuite patient (H-01) — PREREQUIS au resserrement de la policy SELECT missions.
-- Ces 3 fonctions SECURITY DEFINER remplacent les seules lectures legitimes qui
-- dependaient encore de la branche "status='AVAILABLE'" de la policy publique :
--   1) planning patron : courses disponibles (non assignees) de SON organisation
--   2) stats de groupe : lignes d'activite (echangees/acceptees) du groupe
--   3) stats de groupe : compteur de courses disponibles du groupe
-- Chacune verifie l'APPARTENANCE de l'appelant (org / groupe) avant de repondre,
-- donc elle est plus stricte que la branche AVAILABLE actuelle (qui etait globale,
-- meme cross-org). Additif : ne modifie aucune policy ni aucun comportement existant.
-- APPLIQUEE EN PROD le 2026-06-01 via MCP (migration 20260601_masked_org_group_read_rpcs).

-- 1) Planning patron : courses AVAILABLE non assignees de l'org de l'appelant.
--    PII patient incluse (patient_name) : acces legitime de l'org (comportement
--    actuel preserve), mais desormais limite aux MEMBRES de l'org (drivers.org).
CREATE OR REPLACE FUNCTION public.get_org_unassigned_missions(
  p_org_id     uuid,
  p_day_start  timestamptz,
  p_day_end    timestamptz
)
RETURNS TABLE (
  id            uuid,
  scheduled_at  timestamptz,
  duration_min  integer,
  departure     text,
  destination   text,
  type          text,
  price_eur     numeric,
  patient_name  text,
  departure_lat numeric,
  departure_lng numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.scheduled_at, m.duration_min, m.departure, m.destination,
         m.type, m.price_eur, m.patient_name, m.departure_lat, m.departure_lng
  FROM public.missions m
  WHERE m.organization_id = p_org_id
    AND m.status = 'AVAILABLE'
    AND m.scheduled_at >= p_day_start
    AND m.scheduled_at <= p_day_end
    AND EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = auth.uid() AND d.organization_id = p_org_id
    )
  ORDER BY m.scheduled_at ASC;
$$;

-- 2) Stats de groupe : lignes d'activite (toutes statuts) du groupe depuis p_since.
--    AUCUNE PII (ni nom, ni tel) : seulement shared_by / driver_id / dates.
CREATE OR REPLACE FUNCTION public.get_group_activity_rows(
  p_group_id uuid,
  p_since    timestamptz
)
RETURNS TABLE (
  shared_by   uuid,
  driver_id   uuid,
  created_at  timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.shared_by, m.driver_id, m.created_at, m.accepted_at
  FROM public.mission_groups mg
  JOIN public.missions m ON m.id = mg.mission_id
  WHERE mg.group_id = p_group_id
    AND m.created_at >= p_since
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = p_group_id AND gm.driver_id = auth.uid()
    );
$$;

-- 3) Stats de groupe : compteur de courses disponibles a venir du groupe.
--    AUCUNE PII : un simple entier.
CREATE OR REPLACE FUNCTION public.get_group_available_count(
  p_group_id uuid
)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(count(*), 0)::integer
  FROM public.mission_groups mg
  JOIN public.missions m ON m.id = mg.mission_id
  WHERE mg.group_id = p_group_id
    AND m.status = 'AVAILABLE'
    AND m.scheduled_at > now()
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = p_group_id AND gm.driver_id = auth.uid()
    );
$$;

-- Permissions : execution reservee aux utilisateurs authentifies.
REVOKE ALL ON FUNCTION public.get_org_unassigned_missions(uuid, timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_group_activity_rows(uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_group_available_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_org_unassigned_missions(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_activity_rows(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_available_count(uuid) TO authenticated;
