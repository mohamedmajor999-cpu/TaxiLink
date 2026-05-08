-- ============================================================================
-- Phase 2 dispatch : table mission_offers + RPC accept/refuse atomiques.
--
-- Trace une offre de course envoyée à un chauffeur dans le cadre de la cascade.
-- Source de vérité pour :
--   - Vérifier qui a "perdu la guerre du clic" (input du bonus avance Phase 3)
--   - Détecter les expirations (status PENDING + expires_at < now())
--   - Analytics dispatch (% acceptation par rayon, temps de réponse, etc.)
--
-- Lifecycle :
--   PENDING (insert par Edge Function de cascade)
--     → ACCEPTED              (chauffeur a cliqué le premier)
--     → LOST_TO_FASTER_CLICK  (un autre a cliqué avant)
--     → REFUSED               (chauffeur a cliqué refuser)
--     → EXPIRED               (timeout 20s atteint sans action)
--
-- Appliquée en prod 2026-05-07 via MCP.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.mission_offers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id            UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  driver_id             UUID NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING', 'ACCEPTED', 'LOST_TO_FASTER_CLICK', 'REFUSED', 'EXPIRED')),
  radius_km_at_offer    DOUBLE PRECISION NOT NULL,
  distance_km_at_offer  DOUBLE PRECISION,
  sent_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at            TIMESTAMPTZ NOT NULL,
  responded_at          TIMESTAMPTZ,
  CONSTRAINT mission_offers_unique_pair UNIQUE (mission_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_mission_offers_driver_status
  ON public.mission_offers(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_mission_offers_mission_status
  ON public.mission_offers(mission_id, status);
CREATE INDEX IF NOT EXISTS idx_mission_offers_expires_pending
  ON public.mission_offers(expires_at) WHERE status = 'PENDING';

-- ----------------------------------------------------------------------------
-- RLS : un chauffeur voit ses propres offres ; le publisher voit les offres
-- sur ses propres missions (analytics côté patron).
-- Écritures uniquement via les RPC SECURITY DEFINER.
-- ----------------------------------------------------------------------------
ALTER TABLE public.mission_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mission_offers_select_own" ON public.mission_offers;
CREATE POLICY "mission_offers_select_own" ON public.mission_offers
  FOR SELECT TO authenticated
  USING (
    driver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_offers.mission_id AND m.shared_by = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- RPC accept_mission_offer : verrou atomique. Marque l'offre ACCEPTED, flip
-- la mission AVAILABLE→IN_PROGRESS, marque toutes les autres offres PENDING
-- de cette mission en LOST_TO_FASTER_CLICK. Gère la race condition.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_mission_offer(p_offer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller     UUID := auth.uid();
  v_mission_id UUID;
  v_now        TIMESTAMPTZ := now();
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT mo.mission_id INTO v_mission_id
  FROM mission_offers mo
  WHERE mo.id = p_offer_id
    AND mo.driver_id = v_caller
    AND mo.status = 'PENDING'
    AND mo.expires_at > v_now
  FOR UPDATE;

  IF v_mission_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'OFFER_NOT_AVAILABLE');
  END IF;

  UPDATE missions
  SET driver_id   = v_caller,
      status      = 'IN_PROGRESS',
      accepted_at = v_now,
      updated_at  = v_now
  WHERE id = v_mission_id AND status = 'AVAILABLE';

  IF NOT FOUND THEN
    UPDATE mission_offers
    SET status = 'LOST_TO_FASTER_CLICK', responded_at = v_now
    WHERE id = p_offer_id;
    RETURN jsonb_build_object('success', false, 'error', 'MISSION_TAKEN');
  END IF;

  UPDATE mission_offers
  SET status = 'ACCEPTED', responded_at = v_now
  WHERE id = p_offer_id;

  UPDATE mission_offers
  SET status = 'LOST_TO_FASTER_CLICK', responded_at = v_now
  WHERE mission_id = v_mission_id
    AND id <> p_offer_id
    AND status = 'PENDING';

  RETURN jsonb_build_object('success', true, 'mission_id', v_mission_id);
END $$;

GRANT EXECUTE ON FUNCTION public.accept_mission_offer(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_mission_offer(UUID) FROM anon;

-- ----------------------------------------------------------------------------
-- RPC refuse_mission_offer : marque l'offre REFUSED. La cascade pourra
-- élargir au prochain palier sans attendre les 20s.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refuse_mission_offer(p_offer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  UPDATE mission_offers
  SET status = 'REFUSED', responded_at = now()
  WHERE id = p_offer_id
    AND driver_id = v_caller
    AND status = 'PENDING';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'OFFER_NOT_PENDING');
  END IF;

  RETURN jsonb_build_object('success', true);
END $$;

GRANT EXECUTE ON FUNCTION public.refuse_mission_offer(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.refuse_mission_offer(UUID) FROM anon;

COMMENT ON TABLE  public.mission_offers              IS 'Offres de courses envoyées aux chauffeurs lors de la cascade dispatch (Phase 2).';
COMMENT ON FUNCTION public.accept_mission_offer(UUID) IS 'Accepte une offre PENDING de manière atomique (gère la race de clic).';
COMMENT ON FUNCTION public.refuse_mission_offer(UUID) IS 'Refuse une offre PENDING. Permet à la cascade de basculer immédiatement.';

COMMIT;
