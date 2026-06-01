-- ============================================================================
-- Table push_tokens : tokens push Expo / FCM / APNs par chauffeur.
--
-- Un meme user peut avoir plusieurs tokens (un par appareil). On indexe par
-- token (unique) pour le upsert depuis le mobile au boot, et par user_id
-- pour fetch tous les tokens d'un chauffeur quand on envoie la push.
--
-- Token = chaine Expo style "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" (Expo
-- Push Service) ou un FCM/APNs natif si on bypass Expo. last_seen_at sert a
-- detecter les tokens morts (>30j sans refresh => purge).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE,
  platform      TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id
  ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Un user ne peut lire/ecrire que ses propres tokens. Les edge functions
-- (service_role) bypass RLS pour fetch les tokens de tous les chauffeurs
-- matchant un departement.
CREATE POLICY "push_tokens_select_own"
  ON public.push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_insert_own"
  ON public.push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_tokens_update_own"
  ON public.push_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_tokens_delete_own"
  ON public.push_tokens FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;
