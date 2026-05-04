-- Suppression de compte avec anonymisation (RGPD art. 17 — droit a l'oubli)
--
-- Strategie validee avec le user (Q1 = A, anonymisation) :
--   - Les missions historiques sont conservees pour la traceabilite fiscale
--     (obligation de conservation des factures 10 ans, art. L.123-22 Code com).
--   - La PII patient (patient_name, phone, notes) est effacee dans missions.
--   - Le profil est anonymise : "Compte supprime", pas d'avatar, pas de phone.
--   - auth.users est supprime cote API (avec service role) — la cascade FK
--     ne touche pas profiles (qui est gardee anonymisee pour la trace).
--
-- 2 fonctions :
--   - delete_my_account() : appelable par tout user authentifie, anonymise
--     SON propre compte. Granted to authenticated.
--   - _anonymize_user_internal(uuid) : appelee uniquement via le service role
--     (cote /api/admin/users/[id]/delete). Aucun GRANT public.

BEGIN;

-- ============================================================================
-- 1. Colonne soft-delete sur profiles
-- ============================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles (deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- 2. Fonction interne : effectue l'anonymisation. Pas de garde (les guardes
--    sont aux callers : delete_my_account verifie auth.uid(), le service role
--    est trusted par definition).
-- ============================================================================
CREATE OR REPLACE FUNCTION public._anonymize_user_internal(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 2.1) Anonymiser le profil
  UPDATE profiles SET
    first_name = 'Compte',
    last_name  = 'supprimé',
    full_name  = 'Compte supprimé',
    phone      = NULL,
    avatar_url = NULL,
    department = NULL,
    deleted_at = now(),
    updated_at = now()
  WHERE id = p_user_id;

  -- 2.2) Effacer la PII patient des missions ou ce user est partie prenante.
  --      Les colonnes shared_by / driver_id / client_id restent (FK utilisees
  --      pour les agregats fiscaux), mais le profil pointe est deja anonymise.
  UPDATE missions SET
    patient_name = NULL,
    phone        = NULL,
    notes        = NULL,
    updated_at   = now()
  WHERE shared_by = p_user_id
     OR client_id = p_user_id
     OR driver_id = p_user_id;

  -- 2.3) Drivers : reset des champs publics potentiellement PII
  UPDATE drivers SET
    bio           = NULL,
    vehicle_plate = NULL,
    is_online     = false,
    pro_number    = NULL,
    updated_at    = now()
  WHERE id = p_user_id;

  -- 2.4) Preferences utilisateur (jwt meta avec dept_preferences) : la
  --      colonne raw_user_meta_data sera vidée a la suppression de
  --      auth.users via cascade — pas besoin de la toucher ici.
END $$;

-- Pas de GRANT public : seul postgres et le service role peuvent l'appeler.
REVOKE EXECUTE ON FUNCTION public._anonymize_user_internal(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._anonymize_user_internal(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public._anonymize_user_internal(UUID) FROM authenticated;

-- ============================================================================
-- 3. Fonction publique : un user authentifie supprime SON propre compte.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'delete_my_account: aucune session authentifiee'
      USING ERRCODE = '42501';
  END IF;
  PERFORM public._anonymize_user_internal(v_uid);
END $$;

GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon;

COMMIT;
