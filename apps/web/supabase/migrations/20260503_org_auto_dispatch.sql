-- Toggle auto-dispatch sur l'organisation.
--
-- Quand activé, les courses non-assignées qui apparaissent dans le pool
-- de l'org sont automatiquement assignées au meilleur chauffeur via l'algo
-- (voir apps/web/src/components/dashboard/patron/agenda/dispatchAlgorithm.ts)
-- sans confirmation manuelle. Côté UI, le patron voit une toast récap.
--
-- Default: false (mode suggestion par défaut, le patron doit cliquer
-- "Assigner auto" pour valider). À activer via OrgSettingsModal.

BEGIN;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS auto_dispatch_enabled BOOLEAN NOT NULL DEFAULT false;

COMMIT;
