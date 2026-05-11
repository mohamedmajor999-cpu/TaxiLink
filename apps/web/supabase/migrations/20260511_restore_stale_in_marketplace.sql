-- Restore feature STALE dans le marketplace (regression introduite le 9 mai).
--
-- La migration 20260508_expire_stale_missions_cron.sql avait ajoute :
--   - WHERE m.status IN ('AVAILABLE', 'STALE')
--   - AND m.scheduled_at > now() - interval '30 minutes'
-- pour que les courses passees en STALE (15 min apres scheduled_at sans
-- preneur) restent visibles avec un pin "A republier" pendant 30 min total.
--
-- Mais les migrations 20260509_block_self_accept_own_mission.sql puis
-- 20260509_revert_marketplace_self_filter.sql ont reecrit la fonction en
-- copiant une version anterieure a 20260508, perdant ces 2 lignes
-- silencieusement (commit messages ne mentionnaient que le self-filter).
--
-- Cette migration restaure les 2 conditions. Le self-filter reste retire
-- (decision produit confirmee : l'auteur DOIT voir sa propre annonce dans
-- le feed pour la suivre, le frontend gere le blocage du bouton "Accepter").

BEGIN;

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
      NULL::text AS phone
    FROM public.missions m
    -- Restore : STALE inclus, fenetre etendue a now() - 30 min.
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
    ORDER BY m.scheduled_at ASC
    LIMIT GREATEST(LEAST(p_limit, 500), 1)
  ) AS masked;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_missions(TEXT[], INT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_marketplace_missions(TEXT[], INT) FROM anon;

COMMIT;
