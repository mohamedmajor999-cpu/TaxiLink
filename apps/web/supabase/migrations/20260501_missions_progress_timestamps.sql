-- Etend le cycle de vie d'une course IN_PROGRESS avec des sous-etapes
-- granulaires, captures via des horodatages additifs (pas de nouveau status).
--
-- Pourquoi : aujourd'hui IN_PROGRESS est une boite noire ("acceptee, en cours,
-- mais on ne sait pas a quelle etape"). Avec ces timestamps on peut :
--   - afficher au chauffeur ou il en est dans sa course
--   - calculer ponctualite reelle (vs scheduled_at)
--   - calculer duree reelle vs estimee (drift trafic)
--   - resoudre les litiges patients ("le taxi n'est jamais venu")
--
-- enroute_at : chauffeur a quitte sa position pour aller chercher le patient
-- pickup_at  : patient pris en charge (a bord)
-- dropoff_at : depose a destination (mais course pas encore cloturee — buffer
--              pour saisir prix final / signature / photo bon de transport)
-- no_show    : patient absent au RDV → course fermee mais distincte de DONE
--              (ne compte pas dans CA, peut-etre facturee differemment CPAM)
-- auto_completed : la course a ete cloturee par le cron (cf.
--              20260501_missions_auto_complete_cron.sql) et non par le
--              chauffeur. Permet d'afficher un badge "cloture auto" et de lui
--              demander de confirmer le prix.

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS enroute_at     timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_at      timestamptz,
  ADD COLUMN IF NOT EXISTS dropoff_at     timestamptz,
  ADD COLUMN IF NOT EXISTS no_show        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_completed boolean NOT NULL DEFAULT false;

-- Refresh la fonction d'auto-completion pour propager le flag auto_completed.
-- (Cf. 20260501_missions_auto_complete_cron.sql pour le cron qui l'appelle.)
CREATE OR REPLACE FUNCTION public.auto_complete_overdue_missions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE missions
  SET status = 'DONE',
      completed_at = now(),
      auto_completed = true
  WHERE status = 'IN_PROGRESS'
    AND scheduled_at
        + (greatest(coalesce(duration_min, ceil(coalesce(distance_km, 0) * 2.2)::integer), 30) || ' minutes')::interval
        + interval '60 minutes'
        < now();
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$;
