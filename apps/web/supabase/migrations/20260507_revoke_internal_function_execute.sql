-- Durcissement RPC : revoque EXECUTE sur les fonctions qui sont des triggers
-- internes ou des cron jobs, mais que Supabase expose par defaut a anon et
-- authenticated via /rest/v1/rpc/*. Detecte par get_advisors (lints 0028/0029).
--
-- Important : sur Supabase, la permission par defaut est attribuee au pseudo-
-- role PUBLIC (notation =X/postgres dans pg_proc.proacl). anon et authenticated
-- en heritent. Il faut donc REVOKE FROM PUBLIC, pas FROM anon/authenticated.
--
-- Strategie :
--   * Triggers internes purs (handle_*, sync_*, assign_*, set_*) → REVOKE PUBLIC.
--     Ils ne sont jamais appeles directement par l'app.
--   * Cron job (auto_complete_overdue_missions) → REVOKE PUBLIC. Le scheduler
--     pg_cron a son propre role.
--   * Utilitaires SQL (mask_initials, trg_set_updated_at, set_updated_at_now,
--     increment_mission_view_count) → REVOKE PUBLIC. Appeles uniquement depuis
--     d'autres fonctions/triggers cote SQL.
--   * delete_my_account → REVOKE PUBLIC ; le grant explicite a authenticated
--     (existant) reste en place car appele depuis /api/users/delete (RGPD).
--
-- Ajoute aussi SET search_path = public, pg_temp aux fonctions remontees par
-- le lint 0011 (function_search_path_mutable) pour eviter le hijacking.

-- 1) Triggers / utilitaires internes : REVOKE PUBLIC
REVOKE EXECUTE ON FUNCTION public.auto_complete_overdue_missions()                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                                      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_auth_login()                                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_driver_on_profile()                             FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_fleet_group_on_driver_change()                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_profile_claims_to_auth()                          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_default_org_to_driver()                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_mission_org_from_driver()                          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_set_updated_at()                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at_now()                                   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mask_initials(text)                                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_mission_view_count()                         FROM PUBLIC;

-- 2) RPC RGPD : retire PUBLIC mais le grant explicite a authenticated reste
REVOKE EXECUTE ON FUNCTION public.delete_my_account()                                    FROM PUBLIC;

-- 3) Durcissement search_path (lint 0011)
ALTER FUNCTION public.set_mission_org_from_driver()         SET search_path = public, pg_temp;
ALTER FUNCTION public.trg_set_updated_at()                  SET search_path = public, pg_temp;
ALTER FUNCTION public.assign_default_org_to_driver()        SET search_path = public, pg_temp;
ALTER FUNCTION public.mask_initials(text)                   SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_mission_view_count()        SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_auth_login()                   SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at_now()                  SET search_path = public, pg_temp;
