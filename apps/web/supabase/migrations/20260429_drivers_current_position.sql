-- Position GPS du chauffeur en temps reel.
--
-- Probleme : pour le popup "nouvelle course style Uber" et le ciblage
-- geolocalise, on doit savoir ou est physiquement chaque chauffeur en
-- ligne (pas juste son departement de preference).
--
-- Solution : trois colonnes sur drivers, mises a jour throttle (60s)
-- depuis le client tant que is_online = TRUE et que le chauffeur a
-- accorde la geolocalisation. RGPD : la position est ecrasee a chaque
-- ping, pas d'historique conserve.

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS current_lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS current_lng NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS current_position_updated_at TIMESTAMPTZ;

-- Index sur (is_online, current_position_updated_at) pour pouvoir filtrer
-- rapidement les chauffeurs avec une position fraiche (< 5 min) au moment
-- du dispatch d'une nouvelle annonce.
CREATE INDEX IF NOT EXISTS drivers_current_position_idx
  ON drivers (is_online, current_position_updated_at)
  WHERE is_online = TRUE AND current_lat IS NOT NULL;
