-- ============================================================================
-- Phase 3 dispatch : bonus "avance de visibilité" pour chauffeurs ayant perdu
-- la guerre du clic à répétition.
--
-- Règles validées 2026-05-07 :
--   - Plafond : 2 ratés cumulés (= 10 sec d'avance max, à raison de 5s par cran)
--   - Reset : à la prochaine course gagnée (mission_offers.status = ACCEPTED)
--   - Décroissance : si 7 jours sans nouveau "raté" ni "gagné", remise à 0
--   - "Raté" = LOST_TO_FASTER_CLICK uniquement (pas REFUSED ni EXPIRED)
--
-- Mécanisme côté Edge Function dispatch_mission : pour chaque rond, calcule
-- maxStreak parmi les candidats. Chaque offre a unlock_at = now() + (maxStreak
-- - myStreak) * 5s. Le RPC accept_mission_offer rejette si unlock_at > now().
--
-- Appliquée en prod 2026-05-07 via MCP.
-- ============================================================================

BEGIN;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS click_loss_streak SMALLINT NOT NULL DEFAULT 0
    CHECK (click_loss_streak >= 0 AND click_loss_streak <= 2);

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS last_streak_update TIMESTAMPTZ;

ALTER TABLE public.mission_offers
  ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_mission_offers_unlock_at
  ON public.mission_offers(unlock_at) WHERE status = 'PENDING';

CREATE OR REPLACE FUNCTION public.update_driver_click_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'ACCEPTED' THEN
      UPDATE drivers
      SET click_loss_streak = 0, last_streak_update = now()
      WHERE id = NEW.driver_id;
    ELSIF NEW.status = 'LOST_TO_FASTER_CLICK' THEN
      UPDATE drivers
      SET click_loss_streak = LEAST(click_loss_streak + 1, 2),
          last_streak_update = now()
      WHERE id = NEW.driver_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.update_driver_click_streak() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_driver_click_streak() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_driver_click_streak() FROM authenticated;

DROP TRIGGER IF EXISTS mission_offers_streak_update ON public.mission_offers;
CREATE TRIGGER mission_offers_streak_update
  AFTER UPDATE OF status ON public.mission_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_click_streak();

CREATE OR REPLACE FUNCTION public.decay_idle_streaks()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INT;
BEGIN
  UPDATE drivers
  SET click_loss_streak = 0, last_streak_update = NULL
  WHERE click_loss_streak > 0
    AND (last_streak_update IS NULL OR last_streak_update < now() - interval '7 days');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.decay_idle_streaks() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decay_idle_streaks() FROM anon;
REVOKE EXECUTE ON FUNCTION public.decay_idle_streaks() FROM authenticated;

DO $$
BEGIN
  PERFORM cron.unschedule('decay_idle_streaks_daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'decay_idle_streaks_daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'decay_idle_streaks_daily',
  '0 3 * * *',
  $cron$SELECT public.decay_idle_streaks();$cron$
);

-- ============================================================================
-- Patch accept_mission_offer : refuse si unlock_at > now()
-- (un non-bonifié ne peut pas accepter pendant la fenêtre exclusive du bonifié).
-- ============================================================================
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
    AND mo.unlock_at  <= v_now
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

COMMIT;
