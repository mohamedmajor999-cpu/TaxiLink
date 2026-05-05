-- Groupe-flotte auto-géré par organisation
--
-- Objectif : que chaque org dispose d'un groupe "Ma flotte" qui se peuple
-- automatiquement avec ses chauffeurs (drivers.organization_id = org.id).
-- Le patron pourra cocher "Ma flotte" dans le PosterPreflight pour partager
-- une course visible UNIQUEMENT par ses chauffeurs, sans avoir à entretenir
-- une liste à la main.
--
-- Convention : groups.fleet_org_id non-null marque le groupe comme étant
-- LE groupe-flotte de cette org. Unicité garantie via un index unique partiel.

BEGIN;

-- 1. Colonne marqueur sur groups
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS fleet_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_fleet_org
  ON groups (fleet_org_id) WHERE fleet_org_id IS NOT NULL;

-- 2. Fonction qui retourne (et crée si besoin) le groupe-flotte d'une org
CREATE OR REPLACE FUNCTION ensure_fleet_group(target_org_id UUID, fallback_creator UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_group_id UUID;
  v_org_name TEXT;
BEGIN
  SELECT id INTO v_group_id FROM groups WHERE fleet_org_id = target_org_id;
  IF v_group_id IS NOT NULL THEN
    RETURN v_group_id;
  END IF;

  SELECT name INTO v_org_name FROM organizations WHERE id = target_org_id;

  INSERT INTO groups (name, description, created_by, fleet_org_id)
  VALUES (
    'Ma flotte — ' || COALESCE(v_org_name, 'Organisation'),
    'Groupe géré automatiquement (synchro avec les chauffeurs de votre flotte). Ajout/retrait manuels désactivés.',
    fallback_creator,
    target_org_id
  )
  RETURNING id INTO v_group_id;

  RETURN v_group_id;
END $$;

GRANT EXECUTE ON FUNCTION ensure_fleet_group(UUID, UUID) TO authenticated;

-- 3. Trigger : à chaque INSERT ou UPDATE de drivers.organization_id,
--    on re-synchronise l'appartenance au groupe-flotte concerné.
CREATE OR REPLACE FUNCTION sync_fleet_group_on_driver_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_group UUID;
  v_new_group UUID;
BEGIN
  -- Si UPDATE et l'org a changé : retirer du groupe-flotte de l'ancienne org
  IF TG_OP = 'UPDATE'
     AND OLD.organization_id IS DISTINCT FROM NEW.organization_id
     AND OLD.organization_id IS NOT NULL
  THEN
    SELECT id INTO v_old_group FROM groups WHERE fleet_org_id = OLD.organization_id;
    IF v_old_group IS NOT NULL THEN
      DELETE FROM group_members WHERE group_id = v_old_group AND driver_id = NEW.id;
    END IF;
  END IF;

  -- Ajouter au groupe-flotte de la nouvelle org (si org non-null)
  IF NEW.organization_id IS NOT NULL THEN
    v_new_group := ensure_fleet_group(NEW.organization_id, NEW.id);
    INSERT INTO group_members (group_id, driver_id, role)
    VALUES (v_new_group, NEW.id, 'member')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_fleet_on_driver_change ON drivers;
CREATE TRIGGER trg_sync_fleet_on_driver_change
AFTER INSERT OR UPDATE OF organization_id ON drivers
FOR EACH ROW EXECUTE FUNCTION sync_fleet_group_on_driver_change();

-- 4. Backfill : pour chaque org existante, créer le groupe-flotte et y
--    pousser tous les drivers qui ont organization_id = org.
DO $$
DECLARE
  o RECORD;
  d RECORD;
  v_creator UUID;
  v_group_id UUID;
BEGIN
  FOR o IN SELECT id, name FROM organizations LOOP
    -- Chercher un créateur : owner de l'org, sinon premier membre, sinon premier driver
    SELECT user_id INTO v_creator FROM organization_members
      WHERE org_id = o.id AND role = 'owner' LIMIT 1;
    IF v_creator IS NULL THEN
      SELECT user_id INTO v_creator FROM organization_members WHERE org_id = o.id LIMIT 1;
    END IF;
    IF v_creator IS NULL THEN
      SELECT id INTO v_creator FROM drivers WHERE organization_id = o.id LIMIT 1;
    END IF;
    IF v_creator IS NULL THEN
      CONTINUE;  -- org sans aucun membre/driver, on saute
    END IF;

    v_group_id := ensure_fleet_group(o.id, v_creator);

    FOR d IN SELECT id FROM drivers WHERE organization_id = o.id LOOP
      INSERT INTO group_members (group_id, driver_id, role)
      VALUES (v_group_id, d.id, 'member')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
