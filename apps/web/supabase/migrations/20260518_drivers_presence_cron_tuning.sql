-- Tuning du cron de presence chauffeur pour reduire le clignotement
-- "online oui puis non" cote admin (cf. taches #5 sur le diagnostic du
-- 2026-05-18).
--
-- Avant :
--   - TTL 120s : un chauffeur dont last_seen_at > 120s passe is_online=false.
--   - Cron toutes les 60s.
--
-- Probleme : sur Android avec doze mode + battery optimization OEM (Pixel,
-- Samsung), l'OS allonge les intervalles de la background task. L'intervalle
-- idle de 15s peut se transformer en 60-180s. La marge de 8 pings (120/15)
-- est mangee, le cron flip is_online=false, puis l'app repingue, l'admin
-- voit le chauffeur reapparaitre. UX "oui puis non".
--
-- Apres :
--   - TTL 180s : 12 pings de marge a 15s, tolere mieux les longs intervalles.
--   - Cron toutes les 30s : reduit la latence "vraiment offline" perceptible
--     cote admin (couplee au Realtime sur drivers cote client).

DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'driver_presence_cleanup';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
END
$$;

-- pg_cron supporte la syntaxe "N seconds" depuis 1.5 (Supabase ships >= 1.6).
-- Fallback automatique a 60s si la version ne supporte pas (le DO ci-dessous
-- catche l'exception).
DO $$
BEGIN
  PERFORM cron.schedule(
    'driver_presence_cleanup',
    '30 seconds',
    $cron$
      UPDATE drivers
      SET is_online = false
      WHERE is_online = true
        AND (last_seen_at IS NULL OR last_seen_at < now() - interval '180 seconds');
    $cron$
  );
EXCEPTION WHEN OTHERS THEN
  -- Fallback : si "30 seconds" n'est pas supporte, on reste a 1 min.
  PERFORM cron.schedule(
    'driver_presence_cleanup',
    '* * * * *',
    $cron$
      UPDATE drivers
      SET is_online = false
      WHERE is_online = true
        AND (last_seen_at IS NULL OR last_seen_at < now() - interval '180 seconds');
    $cron$
  );
END
$$;
