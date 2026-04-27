-- Heartbeat / TTL pour la presence chauffeur.
--
-- Probleme : drivers.is_online reste a TRUE quand le chauffeur ferme son
-- navigateur, perd le reseau ou crash son device. Resultat : faux positifs
-- "En ligne" dans la page Groupes.
--
-- Solution : ajouter last_seen_at, ping toutes les 60s tant que le chauffeur
-- est en ligne, et considerer le chauffeur reellement online uniquement si
-- last_seen_at > now() - 120s.
--
-- Le client ecrit dans cette colonne via driverService.heartbeat(). Les
-- requetes de presence (groupStatsService.getActivitySummary,
-- getMemberStats) filtrent ensuite cote app.

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Index sur (is_online, last_seen_at) pour les requetes de presence
-- (filtrer les drivers actifs et frais en une passe).
CREATE INDEX IF NOT EXISTS drivers_presence_idx
  ON drivers (is_online, last_seen_at)
  WHERE is_online = TRUE;

-- Backfill : pour les chauffeurs deja online dans la base, on remet
-- last_seen_at = now() le temps qu'ils repingent. Ceux qui ne repingent
-- jamais (browser ferme, etc.) tomberont automatiquement hors-ligne au
-- prochain expire (120s).
UPDATE drivers SET last_seen_at = now() WHERE is_online = TRUE AND last_seen_at IS NULL;
