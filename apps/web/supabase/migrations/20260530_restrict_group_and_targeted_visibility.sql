-- Visibilite des courses restreintes : ne montrer/offrir qu'aux bons chauffeurs.
--
-- Contexte (audit fonctionnel 2026-05-29) :
--   ANN-03 : get_marketplace_missions (la LISTE) filtre les "personnes choisies"
--            (target_user_ids) mais PAS l'appartenance aux groupes -> une course
--            de groupe fuite a tout le departement dans la liste.
--   Complement : compute_visible_drivers (les OFFRES directes du dispatch) fait
--            l'inverse -> il respecte les groupes mais ignore target_user_ids,
--            donc une course "personnes choisies" est offerte a tout le secteur.
--            Devenu actif sur mobile depuis le cablage de dispatch_mission dans
--            createMissionMobile.ts (DISP-01).
--
-- Fix : appliquer LES DEUX restrictions des DEUX cotes (liste + offres), de sorte
-- qu'une course restreinte (par groupe ET/OU par personnes choisies) n'atteigne
-- que les chauffeurs legitimes. Corps reproduits a l'identique du DEPLOYE, seules
-- les clauses de visibilite sont ajoutees.

-- =====================================================================
-- 1) LISTE : get_marketplace_missions — ajoute le filtre GROUP (ANN-03)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_marketplace_missions(p_departments text[] DEFAULT NULL::text[], p_limit integer DEFAULT 100)
 RETURNS SETOF jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT to_jsonb(masked) || jsonb_build_object(
    'mission_groups',
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object('group_id', mg.group_id))
        FROM mission_groups mg
        WHERE mg.mission_id = masked.id
      ),
      '[]'::jsonb
    )
  )
  FROM (
    SELECT
      m.id, m.type, m.status, m.departure, m.destination, m.scheduled_at,
      m.driver_id,
      public.mask_initials(m.patient_name) AS patient_name,
      m.distance_km, m.price_eur, m.price_min_eur, m.price_max_eur,
      m.client_id, m.created_at, m.departement, m.accepted_at, m.completed_at,
      m.departure_lat, m.departure_lng, m.destination_lat, m.destination_lng,
      m.duration_min, m.static_duration_min,
      NULL::text AS notes,
      m.updated_at, m.shared_by, m.visibility, m.medical_motif,
      m.return_trip, m.return_time, m.transport_type, m.companion,
      m.passengers, m.view_count, m.auto_completed, m.no_show,
      m.enroute_at, m.arrived_at_pickup_at, m.arrived_at_dest_at,
      m.pickup_at, m.dropoff_at, m.pickup_signature_url,
      m.transport_voucher_url, m.organization_id,
      m.target_user_ids,
      NULL::text AS phone
    FROM public.missions m
    WHERE m.status IN ('AVAILABLE', 'STALE')
      AND m.scheduled_at > now() - interval '30 minutes'
      AND (
        p_departments IS NULL
        OR cardinality(p_departments) = 0
        OR m.departement = ANY (p_departments)
      )
      AND (
        m.shared_by IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM driver_blocks db
          WHERE (db.blocker_id = auth.uid() AND db.blocked_id = m.shared_by)
             OR (db.blocker_id = m.shared_by AND db.blocked_id = auth.uid())
        )
      )
      -- V7 partage cible : annonce ouverte OU caller dans la liste OU caller = auteur
      AND (
        m.target_user_ids IS NULL
        OR auth.uid() = ANY(m.target_user_ids)
        OR m.shared_by = auth.uid()
      )
      -- FIX ANN-03 : visibilite GROUP appliquee cote serveur (aligne sur
      -- compute_visible_drivers). Si la mission cible des groupes, ne la lister
      -- qu'aux membres de ces groupes (ou a l'auteur). Sans lignes mission_groups
      -- -> mission ouverte au departement (comportement inchange).
      AND (
        NOT EXISTS (SELECT 1 FROM mission_groups mg WHERE mg.mission_id = m.id)
        OR m.shared_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM mission_groups mg
          JOIN group_members gm ON gm.group_id = mg.group_id
          WHERE mg.mission_id = m.id AND gm.driver_id = auth.uid()
        )
      )
    ORDER BY m.scheduled_at ASC
    LIMIT GREATEST(LEAST(p_limit, 500), 1)
  ) AS masked;
$function$;

-- =====================================================================
-- 2) OFFRES : compute_visible_drivers — ajoute le filtre "personnes choisies"
-- =====================================================================
CREATE OR REPLACE FUNCTION public.compute_visible_drivers(p_mission_id uuid, p_radius_km double precision)
 RETURNS TABLE(driver_id uuid, distance_km double precision, current_lat double precision, current_lng double precision, last_position_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dep_lat     DOUBLE PRECISION;
  v_dep_lng     DOUBLE PRECISION;
  v_publisher   UUID;
  -- Relaxé de 90s à 5 min : le mobile peut tarder à pousser sa première
  -- position après login (cold start + transition réseau), 90s était trop
  -- strict et excluait des drivers réellement en ligne et proches.
  v_freshness   TIMESTAMPTZ := now() - interval '5 minutes';
  v_has_groups  BOOLEAN;
  v_target      UUID[];
BEGIN
  SELECT m.departure_lat::DOUBLE PRECISION, m.departure_lng::DOUBLE PRECISION, m.shared_by, m.target_user_ids
    INTO v_dep_lat, v_dep_lng, v_publisher, v_target
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
    -- FIX : "personnes choisies" applique aussi aux OFFRES directes. Si la mission
    -- cible des user_ids precis, ne l'offrir qu'a ces chauffeurs.
    AND (
      v_target IS NULL
      OR d.id = ANY(v_target)
    )
    AND (
      v_publisher IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM driver_blocks db
        WHERE (db.blocker_id = d.id        AND db.blocked_id = v_publisher)
           OR (db.blocker_id = v_publisher AND db.blocked_id = d.id)
      )
    )
    AND public.haversine_km(v_dep_lat, v_dep_lng, d.current_lat::DOUBLE PRECISION, d.current_lng::DOUBLE PRECISION) <= p_radius_km
  ORDER BY dist_km ASC;
END $function$;
