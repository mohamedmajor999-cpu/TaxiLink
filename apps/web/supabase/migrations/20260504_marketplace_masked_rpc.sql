-- Marketplace de missions avec PII patient masquée côté serveur
--
-- Audit RGPD 2026-05-04 : la query `getAvailable` retournait `missions.*`
-- en clair (patient_name, phone, notes) à TOUS les chauffeurs autorisés à
-- voir le feed, alors que la donnée patient ne doit etre disponible qu'au
-- shared_by et au driver_id apres acceptation.
--
-- Solution : fonction RPC `get_marketplace_missions` qui retourne des
-- missions avec :
--   - patient_name → initiales ("Jean Dupont" → "J. D.")
--   - phone        → NULL
--   - notes        → NULL
-- La PII ne quitte JAMAIS Postgres en clair pour ce feed.
--
-- Limite connue (defense en profondeur cote client) : Supabase realtime
-- publie tous les UPDATE de missions avec les colonnes brutes. Le client
-- doit donc aussi appliquer maskMissionForViewer() sur les events realtime
-- pour eviter une fuite via le canal websocket. Voir useMissionRealtime.

BEGIN;

-- ============================================================================
-- Helper : génère les initiales d'un nom complet ("Jean Dupont" → "J. D.").
-- IMMUTABLE car la sortie ne dépend que de l'input.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mask_initials(p_full_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_parts TEXT[];
  v_part  TEXT;
  v_out   TEXT := '';
BEGIN
  IF p_full_name IS NULL OR btrim(p_full_name) = '' THEN
    RETURN NULL;
  END IF;
  v_parts := regexp_split_to_array(btrim(p_full_name), '\s+');
  FOREACH v_part IN ARRAY v_parts LOOP
    IF length(v_part) > 0 THEN
      IF v_out <> '' THEN v_out := v_out || ' '; END IF;
      v_out := v_out || upper(left(v_part, 1)) || '.';
    END IF;
  END LOOP;
  RETURN nullif(v_out, '');
END $$;

-- ============================================================================
-- Fonction RPC : feed des missions disponibles, PII patient masquée.
--
-- Le retour utilise SETOF JSONB pour eviter de dupliquer le schema de
-- la table `missions` (sensible aux ajouts de colonnes futurs). Le client
-- TS recoit chaque mission comme un objet JSON et les types sont gardes
-- via Database['public']['Functions'] (regenere via supabase gen types).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_marketplace_missions(
  p_departments TEXT[] DEFAULT NULL,
  p_limit       INT    DEFAULT 100
)
RETURNS SETOF JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
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
      m.id,
      m.type,
      m.status,
      m.departure,
      m.destination,
      m.scheduled_at,
      m.driver_id,
      public.mask_initials(m.patient_name) AS patient_name,
      m.distance_km,
      m.price_eur,
      m.price_min_eur,
      m.price_max_eur,
      m.client_id,
      m.created_at,
      m.departement,
      m.accepted_at,
      m.completed_at,
      m.departure_lat,
      m.departure_lng,
      m.destination_lat,
      m.destination_lng,
      m.duration_min,
      m.static_duration_min,
      NULL::text AS notes,                       -- masqué (RGPD)
      m.updated_at,
      m.shared_by,
      m.visibility,
      m.medical_motif,                           -- HDJ/CONSULTATION OK (typologie générique)
      m.return_trip,
      m.return_time,
      m.transport_type,
      m.companion,
      m.passengers,
      m.view_count,
      m.auto_completed,
      m.no_show,
      m.enroute_at,
      m.arrived_at_pickup_at,
      m.arrived_at_dest_at,
      m.pickup_at,
      m.dropoff_at,
      m.pickup_signature_url,
      m.transport_voucher_url,
      m.organization_id,
      NULL::text AS phone                        -- masqué (RGPD)
    FROM public.missions m
    WHERE m.status = 'AVAILABLE'
      AND m.scheduled_at > now()
      AND (
        p_departments IS NULL
        OR cardinality(p_departments) = 0
        OR m.departement = ANY (p_departments)
      )
    ORDER BY m.scheduled_at ASC
    LIMIT GREATEST(LEAST(p_limit, 500), 1)
  ) AS masked;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_missions(TEXT[], INT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_marketplace_missions(TEXT[], INT) FROM anon;

COMMIT;
