-- Index sur missions identifies par audit dette technique 2026-05-07.
--
-- Etat avant : seuls missions_pkey (id), idx_missions_org (organization_id) et
-- missions_available_departement_idx (departement, scheduled_at) WHERE
-- status='AVAILABLE' existaient. Toutes les requetes filtrees par driver_id,
-- client_id ou (driver_id + status) faisaient des seq scan.
--
-- Volume actuel : ~150 lignes (seq scan rapide). Ajout preventif pour eviter
-- la degradation a 10x users sans intervention.

-- Filtre patron (mes courses assignees), dashboard chauffeur historique
CREATE INDEX IF NOT EXISTS idx_missions_driver_id
  ON missions(driver_id)
  WHERE driver_id IS NOT NULL;

-- Historique client + facturation
CREATE INDEX IF NOT EXISTS idx_missions_client_id
  ON missions(client_id)
  WHERE client_id IS NOT NULL;

-- Dashboard chauffeur : "mes courses, filtrees par etat, triees par date"
-- Couvre WHERE driver_id=? AND status IN (...) ORDER BY scheduled_at DESC
CREATE INDEX IF NOT EXISTS idx_missions_driver_status_scheduled
  ON missions(driver_id, status, scheduled_at DESC)
  WHERE driver_id IS NOT NULL;
