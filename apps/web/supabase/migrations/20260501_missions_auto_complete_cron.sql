-- Auto-completion des courses oubliees par le chauffeur.
--
-- Pourquoi : aujourd'hui une course passe en IN_PROGRESS quand le chauffeur
-- l'accepte, mais ne passe en DONE que si le chauffeur clique explicitement
-- sur "Terminer". S'il oublie (cas frequent), la course reste indefiniment
-- dans son agenda et pollue les stats. Symptome user : "j'ai pris la course
-- ce matin, elle est encore dans 'a venir' 2h apres".
--
-- Solution : pg_cron toutes les 15 min, complete les courses IN_PROGRESS
-- dont l'heure de fin estimee + 60 min de tolerance est passee.
--
-- Duree estimee : duration_min si dispo, sinon distance_km * 2.2 (vitesse
-- urbaine moyenne ~27 km/h), sinon plancher 30 min. Tolerance 60 min pour
-- ne pas cloturer une course qui depasse legerement (trafic, attente patient).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

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
      completed_at = now()
  WHERE status = 'IN_PROGRESS'
    AND scheduled_at
        + (greatest(coalesce(duration_min, ceil(coalesce(distance_km, 0) * 2.2)::integer), 30) || ' minutes')::interval
        + interval '60 minutes'
        < now();
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto_complete_overdue_missions') THEN
    PERFORM cron.schedule(
      'auto_complete_overdue_missions',
      '*/15 * * * *',  -- toutes les 15 min
      $cron$ SELECT public.auto_complete_overdue_missions(); $cron$
    );
  END IF;
END
$$;
