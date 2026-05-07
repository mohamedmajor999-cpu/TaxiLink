-- Blocage de chauffeurs collègues — règle SYMÉTRIQUE (miroir).
--
-- Si A bloque B :
--   - B ne voit plus aucune annonce publiée par A
--   - A ne voit plus aucune annonce publiée par B
-- → Mur invisible bidirectionnel, même si les deux sont dans le même groupe.
--
-- Discrétion : la personne bloquée ne sait pas qu'elle l'est. Pas de notif,
-- pas de message. La RLS SELECT ne lui permet pas de voir les lignes où elle
-- est `blocked_id` — uniquement le `blocker_id` voit ses propres blocages.
--
-- Le filtre dans le RPC `get_marketplace_missions` utilise un NOT EXISTS sur
-- les deux directions, donc une seule vérif couvre les deux sens.

BEGIN;

-- ============================================================================
-- Table : driver_blocks
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT driver_blocks_no_self_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT driver_blocks_unique_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_blocks_blocker ON driver_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_driver_blocks_blocked ON driver_blocks(blocked_id);

-- ============================================================================
-- RLS : seul le blocker voit/gère ses propres blocages.
-- Le blocked_id n'a aucun moyen de savoir qui l'a bloqué (RLS le cache).
-- ============================================================================
ALTER TABLE driver_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_blocks_select_own" ON driver_blocks;
CREATE POLICY "driver_blocks_select_own" ON driver_blocks
  FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS "driver_blocks_insert_own" ON driver_blocks;
CREATE POLICY "driver_blocks_insert_own" ON driver_blocks
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS "driver_blocks_delete_own" ON driver_blocks;
CREATE POLICY "driver_blocks_delete_own" ON driver_blocks
  FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());

-- ============================================================================
-- Mise à jour du RPC marketplace pour filtrer les missions bloquées.
-- On ajoute un NOT EXISTS qui couvre les deux directions du blocage.
-- Si m.shared_by IS NULL (mission cliente sans publisher chauffeur), pas de filtre.
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
      NULL::text AS phone                        -- masqué (RGPD)
    FROM public.missions m
    WHERE m.status = 'AVAILABLE'
      AND m.scheduled_at > now()
      AND (
        p_departments IS NULL
        OR cardinality(p_departments) = 0
        OR m.departement = ANY (p_departments)
      )
      -- Filtre blocage symétrique : exclure si l'auteur m'a bloqué OU si je l'ai bloqué.
      -- Si m.shared_by IS NULL (mission cliente), pas de filtre — pas d'auteur chauffeur.
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
