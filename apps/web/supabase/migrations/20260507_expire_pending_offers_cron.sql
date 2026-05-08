-- ============================================================================
-- Phase 2 : cron de nettoyage des offres PENDING expirées.
--
-- Toutes les 10 secondes, marque EXPIRED toute offre dont expires_at est passé.
-- responded_at reste NULL (signifie "le chauffeur n'a jamais répondu").
--
-- Latence : worst-case 10s entre l'expiration logique et le flip de status.
-- Acceptable car les UI lisent expires_at pour afficher le compte à rebours,
-- et l'Edge Function de cascade re-vérifie le status mission directement.
--
-- Note : EXPIRED ne compte PAS comme "raté la guerre du clic" (qui est
-- LOST_TO_FASTER_CLICK uniquement). Le bonus avance Phase 3 ne lit que
-- LOST_TO_FASTER_CLICK, pas EXPIRED.
--
-- Appliquée en prod 2026-05-07 via MCP.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.expire_pending_offers()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE mission_offers
  SET status = 'EXPIRED'
  WHERE status = 'PENDING' AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

COMMENT ON FUNCTION public.expire_pending_offers()
  IS 'Cron : flip mission_offers PENDING dont expires_at est passé vers EXPIRED. Retourne le nombre de rows affectés.';

-- Sécurité : la fonction ne doit JAMAIS être appelable directement via /rest/v1/rpc.
-- Seul le cron (rôle postgres) doit l'exécuter.
REVOKE EXECUTE ON FUNCTION public.expire_pending_offers() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_pending_offers() FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_pending_offers() FROM authenticated;

-- Schedule pg_cron : toutes les 10 secondes (sous-minute supporté en pg_cron 1.5+).
-- Idempotent : unschedule d'abord pour permettre les re-runs.
DO $$
BEGIN
  PERFORM cron.unschedule('expire_pending_offers_10s')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire_pending_offers_10s');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire_pending_offers_10s',
  '10 seconds',
  $cron$SELECT public.expire_pending_offers();$cron$
);

COMMIT;
