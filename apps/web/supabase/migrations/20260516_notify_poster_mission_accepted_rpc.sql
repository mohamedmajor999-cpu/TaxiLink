-- RPC appelee par l'edge function notify_poster_mission_accepted. SECURITY DEFINER
-- pour lire push_tokens (RLS restreint a own user) et auth.users.
--
-- Verifie que p_caller_user_id est bien le driver_id de la mission ET que la
-- mission a un shared_by (= annonce postee par un chauffeur, pas une mission
-- client directe). Retourne le token Expo du poster + libelles d'affichage.
--
-- EXECUTE accorde uniquement au service_role.

CREATE OR REPLACE FUNCTION public.get_poster_token_for_accepted_mission(
  p_mission_id UUID,
  p_caller_user_id UUID
)
RETURNS TABLE(
  poster_id UUID,
  token TEXT,
  departure TEXT,
  destination TEXT,
  driver_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    m.shared_by AS poster_id,
    pt.token,
    m.departure,
    m.destination,
    COALESCE(
      NULLIF(TRIM(p.full_name), ''),
      'Un chauffeur'
    ) AS driver_name
  FROM public.missions m
  JOIN public.push_tokens pt ON pt.user_id = m.shared_by
  LEFT JOIN public.profiles p ON p.id = m.driver_id
  WHERE m.id = p_mission_id
    AND m.driver_id = p_caller_user_id
    AND m.shared_by IS NOT NULL
    AND m.shared_by <> p_caller_user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_poster_token_for_accepted_mission(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_poster_token_for_accepted_mission(UUID, UUID) TO service_role;
