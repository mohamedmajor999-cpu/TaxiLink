-- ============================================================================
-- Phase 2 dispatch : brique élémentaire `compute_visible_drivers`.
--
-- Donne la liste des chauffeurs candidats pour une mission donnée et un rayon
-- donné, en appliquant les filtres durs validés 2026-05-07 :
--   1. Chauffeur online (is_online + heartbeat frais < 90s)
--   2. Position GPS fraîche (current_position_updated_at < 90s)
--   3. Membre d'au moins un des groupes où la mission est partagée
--      (fallback legacy : si la mission n'a aucun groupe, visibilité dépt-wide)
--   4. Pas de blocage actif (symétrique — l'asymétrie patron→employé est
--      enforced à l'INSERT par un trigger séparé, pas besoin ici au SELECT)
--   5. Distance ≤ p_radius_km (Haversine, vol d'oiseau)
--   6. Le publisher de la mission lui-même est exclu
--
-- Le filtre Haversine est volontairement coarse (vol d'oiseau, pas OSRM/ETA).
-- L'Edge Function de cascade affinera avec OSRM si besoin pour départager.
--
-- Tri : distance croissante (le plus proche en premier).
--
-- Perf : pas d'index spatial pour l'instant. Acceptable jusqu'à ~1k chauffeurs
-- online par poll. Si ça scale, basculer sur PostGIS + GIST. Voir issue future.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Helper : haversine_km(lat1, lng1, lat2, lng2) → distance en km à vol d'oiseau
-- IMMUTABLE car la sortie ne dépend que des entrées. Réutilisable ailleurs.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 2 * 6371 * asin(
    sqrt(
      power(sin(radians((lat2 - lat1) / 2)), 2)
      + cos(radians(lat1)) * cos(radians(lat2))
        * power(sin(radians((lng2 - lng1) / 2)), 2)
    )
  );
$$;

COMMENT ON FUNCTION public.haversine_km(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION)
  IS 'Distance Haversine en km entre deux points (lat, lng). Vol d''oiseau, rayon Terre 6371 km.';

-- ----------------------------------------------------------------------------
-- compute_visible_drivers(mission_id, radius_km)
-- Renvoie la liste triée par distance des chauffeurs candidats.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_visible_drivers(
  p_mission_id UUID,
  p_radius_km  DOUBLE PRECISION
)
RETURNS TABLE (
  driver_id        UUID,
  distance_km      DOUBLE PRECISION,
  current_lat      DOUBLE PRECISION,
  current_lng      DOUBLE PRECISION,
  last_position_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dep_lat     DOUBLE PRECISION;
  v_dep_lng     DOUBLE PRECISION;
  v_publisher   UUID;
  v_freshness   TIMESTAMPTZ := now() - interval '90 seconds';
  v_has_groups  BOOLEAN;
BEGIN
  SELECT m.departure_lat::DOUBLE PRECISION, m.departure_lng::DOUBLE PRECISION, m.shared_by
    INTO v_dep_lat, v_dep_lng, v_publisher
  FROM missions m
  WHERE m.id = p_mission_id;

  IF v_dep_lat IS NULL OR v_dep_lng IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM mission_groups WHERE mission_id = p_mission_id
  ) INTO v_has_groups;

  RETURN QUERY
  SELECT
    d.id,
    public.haversine_km(v_dep_lat, v_dep_lng, d.current_lat::DOUBLE PRECISION, d.current_lng::DOUBLE PRECISION) AS dist_km,
    d.current_lat::DOUBLE PRECISION,
    d.current_lng::DOUBLE PRECISION,
    d.current_position_updated_at
  FROM drivers d
  WHERE d.is_online = true
    AND d.current_lat IS NOT NULL
    AND d.current_lng IS NOT NULL
    AND d.current_position_updated_at IS NOT NULL
    AND d.current_position_updated_at > v_freshness
    AND (v_publisher IS NULL OR d.id <> v_publisher)
    AND (
      NOT v_has_groups
      OR EXISTS (
        SELECT 1
        FROM mission_groups mg
        JOIN group_members gm ON gm.group_id = mg.group_id
        WHERE mg.mission_id = p_mission_id
          AND gm.driver_id = d.id
      )
    )
    AND (
      v_publisher IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM driver_blocks db
        WHERE (db.blocker_id = d.id        AND db.blocked_id = v_publisher)
           OR (db.blocker_id = v_publisher AND db.blocked_id = d.id)
      )
    )
    AND public.haversine_km(v_dep_lat, v_dep_lng, d.current_lat, d.current_lng) <= p_radius_km
  ORDER BY dist_km ASC;
END $$;

COMMENT ON FUNCTION public.compute_visible_drivers(UUID, DOUBLE PRECISION)
  IS 'Phase 2 dispatch : chauffeurs candidats pour une mission dans un rayon donné. Filtres : online, GPS frais, groupes, blocages, ≠ publisher. Tri par distance.';

GRANT EXECUTE ON FUNCTION public.compute_visible_drivers(UUID, DOUBLE PRECISION) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_visible_drivers(UUID, DOUBLE PRECISION) FROM anon;

GRANT EXECUTE ON FUNCTION public.haversine_km(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.haversine_km(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM anon;

COMMIT;

-- ============================================================================
-- TESTS À EXÉCUTER MANUELLEMENT DANS SUPABASE SQL EDITOR :
--
-- 1) Sanity : haversine entre deux points connus (Marseille → Aix ~30 km)
--    SELECT public.haversine_km(43.2965, 5.3698, 43.5263, 5.4454);
--    Résultat attendu : ~28-30 km
--
-- 2) Lister les candidats pour une mission existante avec un rayon de 5 km
--    SELECT * FROM public.compute_visible_drivers(
--      '<UUID_MISSION_AVAILABLE>'::UUID, 5.0
--    );
--    Doit renvoyer 0..N rows triés par distance_km croissant.
--
-- 3) Vérifier qu'un publisher n'apparaît jamais dans ses propres candidats :
--    SELECT m.shared_by, cvd.driver_id
--    FROM missions m, compute_visible_drivers(m.id, 50.0) cvd
--    WHERE m.shared_by IS NOT NULL AND cvd.driver_id = m.shared_by;
--    Résultat attendu : 0 row.
-- ============================================================================
