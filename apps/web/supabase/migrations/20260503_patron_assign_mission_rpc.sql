-- RPC pour qu'un patron (owner/admin/dispatcher d'une org) puisse assigner
-- une mission disponible à un chauffeur de SA flotte.
--
-- Pourquoi : les RLS UPDATE sur missions n'autorisent que le chauffeur LUI-MÊME
-- à s'auto-assigner ("Acceptation mission disponible" with_check : driver_id = auth.uid()).
-- Pour le dispatch côté patron, il faut bypasser via SECURITY DEFINER tout en
-- vérifiant explicitement le rôle.

BEGIN;

CREATE OR REPLACE FUNCTION patron_assign_mission(target_mission_id UUID, target_driver_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID;
  v_caller_role TEXT;
  v_mission_org UUID;
  v_mission_status TEXT;
  v_target_driver_org UUID;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT organization_id, status INTO v_mission_org, v_mission_status
  FROM missions WHERE id = target_mission_id;
  IF v_mission_org IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'MISSION_NOT_FOUND');
  END IF;
  IF v_mission_status != 'AVAILABLE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'MISSION_NOT_AVAILABLE');
  END IF;

  SELECT role INTO v_caller_role
  FROM organization_members
  WHERE org_id = v_mission_org AND user_id = v_caller;
  IF v_caller_role NOT IN ('owner', 'admin', 'dispatcher') THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT organization_id INTO v_target_driver_org
  FROM drivers WHERE id = target_driver_id;
  IF v_target_driver_org IS DISTINCT FROM v_mission_org THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRIVER_NOT_IN_ORG');
  END IF;

  UPDATE missions
  SET driver_id = target_driver_id,
      status = 'IN_PROGRESS',
      accepted_at = now(),
      updated_at = now()
  WHERE id = target_mission_id AND status = 'AVAILABLE';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'UPDATE_FAILED');
  END IF;

  RETURN jsonb_build_object('success', true);
END $$;

GRANT EXECUTE ON FUNCTION patron_assign_mission(UUID, UUID) TO authenticated;

COMMIT;
