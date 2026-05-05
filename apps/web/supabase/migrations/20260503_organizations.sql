-- Multi-tenancy : tables organizations + organization_members + colonne
-- organization_id sur drivers/missions + RLS sur les nouvelles tables.
--
-- Décisions clés (cf. TODO-2026-05-02.md section "🏢 Dashboard Patron") :
--   * RLS strict sur organizations / organization_members uniquement
--   * Pas de RLS strict org sur drivers/missions : TaxiLink est un marketplace
--     cross-org, on garde les policies existantes intactes. Le filtre par org
--     pour le dashboard patron se fait côté code (services).
--   * Trigger qui auto-remplit missions.organization_id depuis l'org du driver
--     (à l'INSERT et à l'UPDATE quand un driver accepte la mission).
--
-- Wrappé en transaction : si une seule étape échoue, rollback total.

BEGIN;

-- ============================================================================
-- 1. Tables organizations + organization_members
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  siret               TEXT,
  plan                TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  stripe_customer_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'dispatcher', 'accountant', 'viewer')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- ============================================================================
-- 2. Colonne organization_id sur drivers et missions
-- ============================================================================

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_drivers_org  ON drivers(organization_id);
CREATE INDEX IF NOT EXISTS idx_missions_org ON missions(organization_id);

-- ============================================================================
-- 3. Fonction current_org_ids() — utilisée par les RLS et les hooks front
-- ============================================================================

CREATE OR REPLACE FUNCTION current_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT org_id FROM organization_members WHERE user_id = auth.uid()
$$;

-- ============================================================================
-- 4. RLS sur les nouvelles tables uniquement (cf. décisions)
-- ============================================================================

ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members  ENABLE ROW LEVEL SECURITY;

-- Lire sa/ses orgs
CREATE POLICY "org_select_members" ON organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT current_org_ids()));

-- Modifier l'org : owner ou admin uniquement
CREATE POLICY "org_update_admin" ON organizations
  FOR UPDATE TO authenticated
  USING (id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Voir les membres de ses orgs
CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT current_org_ids()));

-- Inviter / supprimer / changer rôle : owner ou admin uniquement
CREATE POLICY "org_members_manage" ON organization_members
  FOR ALL TO authenticated
  USING (org_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- ============================================================================
-- 5. Backfill — créer "TaxiLink Default" et y rattacher tout l'existant
-- ============================================================================

DO $$
DECLARE
  v_org_id      UUID;
  v_mohamed_id  UUID;
  v_drivers_n   INT;
  v_missions_n  INT;
BEGIN
  -- Localiser le compte de Mohamed (compte principal Supabase)
  SELECT id INTO v_mohamed_id
  FROM auth.users
  WHERE email = 'mohamed.major@outlook.fr';

  IF v_mohamed_id IS NULL THEN
    RAISE EXCEPTION 'Compte mohamed.major@outlook.fr introuvable dans auth.users — backfill impossible';
  END IF;

  -- Créer l'org "TaxiLink Default"
  INSERT INTO organizations (name)
  VALUES ('TaxiLink Default')
  RETURNING id INTO v_org_id;

  -- Mohamed = owner
  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_org_id, v_mohamed_id, 'owner');

  -- Backfill drivers
  UPDATE drivers SET organization_id = v_org_id WHERE organization_id IS NULL;
  GET DIAGNOSTICS v_drivers_n = ROW_COUNT;

  -- Backfill missions
  UPDATE missions SET organization_id = v_org_id WHERE organization_id IS NULL;
  GET DIAGNOSTICS v_missions_n = ROW_COUNT;

  RAISE NOTICE 'Backfill OK : org=%, mohamed=%, drivers maj=%, missions maj=%',
    v_org_id, v_mohamed_id, v_drivers_n, v_missions_n;
END $$;

-- ============================================================================
-- 6. NOT NULL après backfill — sur drivers seulement
-- ============================================================================
-- missions.organization_id reste nullable : un client externe peut poster une
-- mission sans org. Le trigger ci-dessous l'auto-remplit dès qu'un driver est
-- assigné (acceptation d'une mission AVAILABLE).

ALTER TABLE drivers ALTER COLUMN organization_id SET NOT NULL;

-- ============================================================================
-- 7. Trigger : auto-remplir missions.organization_id
-- ============================================================================

CREATE OR REPLACE FUNCTION set_mission_org_from_driver()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si organization_id déjà défini explicitement, on respecte
  IF NEW.organization_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Priorité 1 : depuis driver_id (mission acceptée ou postée par chauffeur)
  IF NEW.driver_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM drivers WHERE id = NEW.driver_id;
  END IF;

  -- Priorité 2 : depuis shared_by (chauffeur poseur)
  IF NEW.organization_id IS NULL AND NEW.shared_by IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM drivers WHERE id = NEW.shared_by;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS missions_set_org_before_insert ON missions;
CREATE TRIGGER missions_set_org_before_insert
  BEFORE INSERT ON missions
  FOR EACH ROW
  EXECUTE FUNCTION set_mission_org_from_driver();

-- Trigger BEFORE UPDATE : si driver_id change (ex: acceptation), recalculer
DROP TRIGGER IF EXISTS missions_set_org_before_update ON missions;
CREATE TRIGGER missions_set_org_before_update
  BEFORE UPDATE OF driver_id ON missions
  FOR EACH ROW
  WHEN (NEW.organization_id IS NULL AND NEW.driver_id IS NOT NULL)
  EXECUTE FUNCTION set_mission_org_from_driver();

-- ============================================================================
-- 8. updated_at trigger sur organizations (cohérence avec drivers/missions)
-- ============================================================================

CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS organizations_set_updated_at ON organizations;
CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_updated_at();

COMMIT;
