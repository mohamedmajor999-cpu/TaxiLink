-- Cleanup automatique des drivers fantomes (is_online=true mais last_seen_at expire).
--
-- Pourquoi : le filtre cote requete (groupStatsService.isFreshlyOnline)
-- masque deja les fantomes a l'affichage. Mais la base reste sale, ce qui
-- pollue les exports BI, les dashboards admin et les requetes externes.
--
-- Solution : pg_cron job toutes les minutes qui passe is_online=false
-- pour tous les drivers dont last_seen_at < now() - 120s.
-- TTL identique au filtre client (cf. ONLINE_TTL_MS dans groupStatsService).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Schedule le job toutes les 60s. Le SELECT cron.schedule renvoie le jobid.
-- IF NOT EXISTS via WHERE NOT EXISTS pour rester idempotent au replay de la
-- migration (pg_cron n'a pas de syntaxe IF NOT EXISTS native).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'driver_presence_cleanup') THEN
    PERFORM cron.schedule(
      'driver_presence_cleanup',
      '* * * * *',  -- toutes les minutes
      $cron$
        UPDATE drivers
        SET is_online = false
        WHERE is_online = true
          AND (last_seen_at IS NULL OR last_seen_at < now() - interval '120 seconds');
      $cron$
    );
  END IF;
END
$$;
