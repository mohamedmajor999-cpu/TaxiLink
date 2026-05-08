-- Cycle de vie des missions AVAILABLE non prises :
--   AVAILABLE → STALE  (à T+15 min apres scheduled_at)  : pin grise "À republier"
--   STALE     → EXPIRED (à T+30 min apres scheduled_at) : pin retire
--
-- Reference temps = scheduled_at (et non created_at) pour gerer correctement
-- les rares courses planifiees : une course publiee a 13h pour 14h ne devient
-- STALE qu'a 14h15, pas a 13h15.
--
-- Le RPC get_marketplace_missions est mis a jour en parallele pour :
--  - inclure status='STALE' (pin grise)
--  - etendre la fenetre temporelle a (now() - 30 min) afin que les courses
--    immediates (scheduled_at = now() a la creation) restent visibles en pin
--    pendant 30 min apres leur heure prevue.

CREATE OR REPLACE FUNCTION public.expire_stale_missions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Phase 1 : AVAILABLE → STALE apres 15 min sans preneur
  UPDATE public.missions
     SET status = 'STALE'
   WHERE status = 'AVAILABLE'
     AND scheduled_at < now() - interval '15 minutes';

  -- Phase 2 : STALE/AVAILABLE → EXPIRED apres 30 min total
  -- (AVAILABLE inclus pour defense en profondeur si phase 1 a saute un tick)
  UPDATE public.missions
     SET status = 'EXPIRED'
   WHERE status IN ('AVAILABLE', 'STALE')
     AND scheduled_at < now() - interval '30 minutes';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_stale_missions() FROM PUBLIC;

-- Index partiel pour que les UPDATE filtrent vite (la table grandit avec DONE)
CREATE INDEX IF NOT EXISTS idx_missions_status_scheduled_at
  ON public.missions (status, scheduled_at)
  WHERE status IN ('AVAILABLE', 'STALE');

-- pg_cron : toutes les 60s (granularite 1 min suffit pour seuils de 15/30 min)
SELECT cron.schedule(
  'expire-stale-missions',
  '* * * * *',
  $cron$ SELECT public.expire_stale_missions(); $cron$
);

-- Mise a jour du RPC marketplace pour exposer STALE et etendre la fenetre
CREATE OR REPLACE FUNCTION public.get_marketplace_missions(
  p_departments text[] DEFAULT NULL::text[],
  p_limit       integer DEFAULT 100
)
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SET search_path = public
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
      NULL::text AS notes,
      m.updated_at,
      m.shared_by,
      m.visibility,
      m.medical_motif,
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
    ORDER BY m.scheduled_at ASC
    LIMIT GREATEST(LEAST(p_limit, 500), 1)
  ) AS masked;
$function$;
