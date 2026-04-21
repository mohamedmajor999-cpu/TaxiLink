-- Tranche de prix pour les courses privées
--
-- Le chauffeur ne sait pas toujours si son retour sera en charge ou à vide ;
-- plutôt que de trancher par une case à cocher "retour à vide", on propose
-- une fourchette (min = retour en charge, max = retour à vide).
--
-- * price_min_eur : borne basse (jamais vide si range publié)
-- * price_max_eur : borne haute (>= min, jamais vide si range publié)
--
-- `price_eur` reste la valeur canonique utilisée par les stats/tri :
--   - CPAM ou prix fixe : price_eur = valeur unique, min/max = NULL
--   - Privé avec fourchette : price_eur = (min + max) / 2, min/max renseignés

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS price_min_eur NUMERIC,
  ADD COLUMN IF NOT EXISTS price_max_eur NUMERIC;

ALTER TABLE missions
  DROP CONSTRAINT IF EXISTS missions_price_range_check;
ALTER TABLE missions
  ADD CONSTRAINT missions_price_range_check
  CHECK (
    (price_min_eur IS NULL AND price_max_eur IS NULL)
    OR (
      price_min_eur IS NOT NULL
      AND price_max_eur IS NOT NULL
      AND price_min_eur >= 0
      AND price_max_eur >= price_min_eur
      AND price_max_eur <= 500
    )
  );
