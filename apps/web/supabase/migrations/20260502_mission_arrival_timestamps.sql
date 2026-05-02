-- Phase 1 du suivi GPS automatique : capture des deux moments distincts
-- "arrivée à l'adresse" vs "patient à bord" (idem côté dépose).
--
-- Pourquoi : aujourd'hui pickup_at et dropoff_at melangent deux signaux
-- (arrivée GPS dans la zone + interaction avec le patient). Avec ces deux
-- nouvelles colonnes, le hook useAutoMissionProgress peut :
--   - confirmer l'arrivee a la prise (chauffeur dans 80m, attendu 2min) →
--     arrived_at_pickup_at
--   - puis detecter le redemarrage (sortie de la zone vers la destination) →
--     pickup_at
--   - meme schema cote depose : arrived_at_dest_at puis dropoff_at
--
-- Les colonnes existantes (enroute_at, pickup_at, dropoff_at, completed_at)
-- restent inchangees ; on AJOUTE deux jalons intermediaires.

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS arrived_at_pickup_at timestamptz,
  ADD COLUMN IF NOT EXISTS arrived_at_dest_at   timestamptz;
