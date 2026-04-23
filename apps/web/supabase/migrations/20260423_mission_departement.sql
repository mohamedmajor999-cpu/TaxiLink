-- Scoping géographique par département
--
-- Un chauffeur travaille dans un ou quelques départements. Diffuser toutes
-- les missions à tous les chauffeurs ne tient plus dès 10k users.
-- On stocke le code département sur chaque mission et on indexe pour permettre
-- un filtrage serveur efficace dans le feed AVAILABLE.
--
-- Format du code :
--   - Métropole : "01" à "95" (sauf "20")
--   - Corse : "2A" (< 20200) ou "2B" (>= 20200)
--   - DROM-COM : "971"..."978"
--   - NULL toléré si adresse sans code postal parsable (legacy)
--
-- Le calcul est fait côté application (voir src/lib/departement.ts) ; la DB
-- ne fait que stocker/indexer. Ce choix permet d'avoir la même logique
-- utilisée côté write et côté UI de filtrage.

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS departement TEXT;

-- Index partiel sur le feed hot-path : on ne charge jamais l'historique par dept,
-- seul le listing AVAILABLE en a besoin. `scheduled_at` complète pour garder
-- l'ordre naturel du feed.
CREATE INDEX IF NOT EXISTS missions_available_departement_idx
  ON missions (departement, scheduled_at)
  WHERE status = 'AVAILABLE';

-- ─── Backfill des missions existantes ───────────────────────────────────────
-- Réplique la logique de src/lib/departement.ts en SQL. À jouer une seule
-- fois après le ALTER TABLE.
UPDATE missions
SET departement = CASE
  -- Pas de code postal français 5 chiffres trouvé
  WHEN substring(departure from '\m\d{5}\M') IS NULL
    THEN NULL
  -- DROM-COM (97xxx → 3 premiers chiffres, filtrés sur dept valides)
  WHEN substring(departure from '\m\d{5}\M') LIKE '97%'
    THEN CASE substring(substring(departure from '\m\d{5}\M') for 3)
      WHEN '971' THEN '971' WHEN '972' THEN '972' WHEN '973' THEN '973'
      WHEN '974' THEN '974' WHEN '975' THEN '975' WHEN '976' THEN '976'
      WHEN '977' THEN '977' WHEN '978' THEN '978'
      ELSE NULL
    END
  -- Corse : < 20200 → 2A, sinon 2B
  WHEN substring(departure from '\m\d{5}\M') LIKE '20%'
    THEN CASE WHEN substring(departure from '\m\d{5}\M')::int < 20200 THEN '2A' ELSE '2B' END
  -- Métropole : 2 premiers chiffres, valides 01..95
  WHEN substring(substring(departure from '\m\d{5}\M') for 2)::int BETWEEN 1 AND 95
    THEN substring(substring(departure from '\m\d{5}\M') for 2)
  ELSE NULL
END
WHERE departement IS NULL;
