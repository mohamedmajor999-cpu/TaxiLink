-- Suite du chantier dashboard patron : on arrete d'envoyer chaque nouveau
-- chauffeur dans l'org "TaxiLink Default" (= chez Mohamed). A la place, on
-- cree une org neutre "Independants" qui sert de pool par defaut.
--
-- Comportement futur :
--   * Inscription publique --> driver rattache a "Independants" (pas a Mohamed)
--   * Patron qui invite un driver dans son org --> set explicite, trigger no-op
--   * Patron qui vire un driver --> retour dans "Independants"
--
-- Les 7 chauffeurs deja en place restent dans "TaxiLink Default" (decision
-- pragmatique : Mohamed peut maintenant les virer un par un via le bouton
-- "Virer" du dashboard P1 si certains ne sont pas vraiment ses chauffeurs).

BEGIN;

-- 1. Creer l'org "Independants" si elle n'existe pas
INSERT INTO organizations (name, plan)
SELECT 'Independants', 'free'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Independants');

-- 2. Modifier le trigger pour pointer vers "Independants" au lieu de
--    "TaxiLink Default". Le nom de la fonction reste pour ne pas casser
--    le trigger (drivers_assign_default_org).
CREATE OR REPLACE FUNCTION assign_default_org_to_driver()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_default_org_id UUID;
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT id INTO v_default_org_id
    FROM organizations
    WHERE name = 'Independants'
    LIMIT 1;

    IF v_default_org_id IS NULL THEN
      RAISE EXCEPTION 'Org "Independants" introuvable -- creer cette org avant tout INSERT driver';
    END IF;

    NEW.organization_id := v_default_org_id;
  END IF;
  RETURN NEW;
END $$;

COMMIT;
