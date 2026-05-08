-- ============================================================================
-- Patch driver_blocks : asymétrie patron↔employé.
--
-- Décision produit 2026-05-07 : un employé NE PEUT PAS bloquer le patron de
-- son organisation (sinon il ne verrait plus ses propres courses internes,
-- absurde opérationnellement). Le patron garde le droit de bloquer un employé.
--
-- La migration `20260507_driver_blocks.sql` créait la table avec règle
-- symétrique pure. Ce patch ajoute un trigger BEFORE INSERT qui rejette
-- l'opération si la cible est patron (owner/admin/dispatcher) dans une org
-- où l'auteur figure dans `drivers.organization_id`.
--
-- Pourquoi un trigger plutôt qu'une CHECK constraint : la CHECK ne peut pas
-- référencer d'autres tables (organization_members + drivers).
--
-- Le DELETE reste libre côté RLS (déjà couvert par driver_blocks_delete_own).
-- Cas légitime : un ancien patron rétrogradé qui doit pouvoir être débloqué.
--
-- Idempotent : utilise CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS.
-- Peut être appliqué que la migration 20260507_driver_blocks.sql soit en
-- prod ou pas (ré-application sans effet).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Trigger function : rejette l'INSERT si blocked_id est un patron de l'org
-- du blocker_id (employé chauffeur).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_driver_block_asymmetry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- L'auteur du blocage est-il un chauffeur dans une org où la cible est
  -- owner/admin/dispatcher ? Si oui → rejet.
  IF EXISTS (
    SELECT 1
    FROM drivers d_blocker
    JOIN organization_members om_target
      ON om_target.org_id  = d_blocker.organization_id
     AND om_target.user_id = NEW.blocked_id
     AND om_target.role IN ('owner', 'admin', 'dispatcher')
    WHERE d_blocker.id = NEW.blocker_id
  ) THEN
    RAISE EXCEPTION 'CANNOT_BLOCK_OWN_PATRON'
      USING HINT  = 'Un employé ne peut pas bloquer le patron (owner/admin/dispatcher) de son organisation.',
            ERRCODE = '42501';
  END IF;

  RETURN NEW;
END $$;

COMMENT ON FUNCTION public.enforce_driver_block_asymmetry()
  IS 'Trigger BEFORE INSERT sur driver_blocks : rejette si l''auteur (chauffeur d''une org) tente de bloquer un patron de la même org.';

-- ----------------------------------------------------------------------------
-- Attache le trigger sur la table driver_blocks
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS driver_blocks_asymmetry_check ON driver_blocks;
CREATE TRIGGER driver_blocks_asymmetry_check
  BEFORE INSERT ON driver_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_driver_block_asymmetry();

-- Sécurité : le trigger function ne doit JAMAIS être appelable directement
-- via /rest/v1/rpc (warning Supabase advisor 0028/0029).
REVOKE EXECUTE ON FUNCTION public.enforce_driver_block_asymmetry() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_driver_block_asymmetry() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_driver_block_asymmetry() FROM authenticated;

COMMIT;

-- ============================================================================
-- TESTS À EXÉCUTER MANUELLEMENT DANS SUPABASE SQL EDITOR :
--
-- 1) Cas autorisé : patron bloque son employé
--    INSERT INTO driver_blocks (blocker_id, blocked_id)
--    VALUES ('<UUID_PATRON>', '<UUID_EMPLOYE_DE_SON_ORG>');
--    → doit RÉUSSIR.
--
-- 2) Cas autorisé : employé bloque un autre chauffeur (pas patron)
--    INSERT INTO driver_blocks (blocker_id, blocked_id)
--    VALUES ('<UUID_EMPLOYE>', '<UUID_AUTRE_CHAUFFEUR_HORS_ORG>');
--    → doit RÉUSSIR.
--
-- 3) Cas REJETÉ : employé tente de bloquer son patron
--    INSERT INTO driver_blocks (blocker_id, blocked_id)
--    VALUES ('<UUID_EMPLOYE>', '<UUID_PATRON_DE_SON_ORG>');
--    → doit ÉCHOUER avec EXCEPTION 'CANNOT_BLOCK_OWN_PATRON' (SQLSTATE 42501).
--
-- 4) Cas autorisé : freelance hors-org bloque un patron qu'il croise
--    (le freelance n'a pas drivers.organization_id pointant vers cette org)
--    → doit RÉUSSIR (cas symétrique général, l'asymétrie ne s'applique pas).
-- ============================================================================
