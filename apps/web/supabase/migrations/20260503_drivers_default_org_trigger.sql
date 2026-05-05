-- Correctif post-migration `20260503_organizations.sql`.
--
-- Problème : drivers.organization_id est NOT NULL, mais le trigger
-- `create_driver_on_profile` (déclenché à chaque inscription via
-- `handle_new_user`) ne définit pas cette colonne — toute nouvelle
-- inscription planterait avec "null value in column organization_id".
--
-- Solution : trigger BEFORE INSERT qui assigne automatiquement à l'org
-- "TaxiLink Default" si aucune org n'est explicitement passée.
--
-- Comportement futur :
--   * Inscription publique → driver rattaché à "TaxiLink Default"
--   * Patron qui invite un driver dans son org → set explicite, trigger no-op
--   * Réassignation possible plus tard via UI dashboard patron

BEGIN;

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
    WHERE name = 'TaxiLink Default'
    LIMIT 1;

    IF v_default_org_id IS NULL THEN
      RAISE EXCEPTION 'Org "TaxiLink Default" introuvable — créer cette org avant tout INSERT driver';
    END IF;

    NEW.organization_id := v_default_org_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS drivers_assign_default_org ON drivers;
CREATE TRIGGER drivers_assign_default_org
  BEFORE INSERT ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_org_to_driver();

COMMIT;
