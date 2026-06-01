-- RPC appelee par l'edge function notify_drivers_new_mission. SECURITY DEFINER
-- pour lire auth.users.raw_user_meta_data (pas accessible via RLS classique).
-- EXECUTE accorde uniquement au service_role.

CREATE OR REPLACE FUNCTION public.get_drivers_for_dept_push(p_dept TEXT)
RETURNS TABLE(user_id UUID, token TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT pt.user_id, pt.token
  FROM public.push_tokens pt
  JOIN auth.users u ON u.id = pt.user_id
  WHERE u.raw_user_meta_data->'dept_preferences' @> to_jsonb(p_dept)
    AND COALESCE(
      (u.raw_user_meta_data->'notification_prefs'->>'popupNewMission')::boolean,
      true
    ) = true;
$$;

REVOKE EXECUTE ON FUNCTION public.get_drivers_for_dept_push(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_drivers_for_dept_push(TEXT) TO service_role;
