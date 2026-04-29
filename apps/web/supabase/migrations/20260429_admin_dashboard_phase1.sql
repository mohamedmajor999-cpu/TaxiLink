-- Dashboard admin — Phase 1 : suivi des coûts d'API et historique des connexions.
--
-- Ajoute trois tables :
--   1. ai_usage              : 1 ligne par appel à un LLM (Anthropic, etc.)
--   2. auth_login_events     : 1 ligne par connexion utilisateur (alimentée par trigger sur auth.users)
--   3. google_api_costs      : saisie manuelle mensuelle des coûts Google Cloud (Places, Routes…)
--
-- RLS : seules les API routes côté serveur lisent ces tables (via service_role).
-- Les utilisateurs authentifiés peuvent uniquement INSERT dans ai_usage pour
-- logger leur propre conso. Personne d'autre ne lit/écrit côté client.

-- ============================================================================
-- 1. ai_usage
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint        TEXT NOT NULL,
  model           TEXT NOT NULL,
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  cost_usd        NUMERIC(10, 6) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx ON ai_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_created_idx       ON ai_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_endpoint_idx      ON ai_usage (endpoint, created_at DESC);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Tout user authentifié peut INSERT (sa propre conso, vérifiée par user_id = auth.uid())
DROP POLICY IF EXISTS ai_usage_insert_own ON ai_usage;
CREATE POLICY ai_usage_insert_own ON ai_usage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Lecture interdite côté client (les routes /api/admin/* utilisent service_role)
DROP POLICY IF EXISTS ai_usage_select_none ON ai_usage;
CREATE POLICY ai_usage_select_none ON ai_usage
  FOR SELECT TO authenticated
  USING (false);

-- ============================================================================
-- 2. auth_login_events
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_login_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_login_events_created_idx ON auth_login_events (created_at DESC);
CREATE INDEX IF NOT EXISTS auth_login_events_user_idx    ON auth_login_events (user_id, created_at DESC);

ALTER TABLE auth_login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_login_events_select_none ON auth_login_events;
CREATE POLICY auth_login_events_select_none ON auth_login_events
  FOR SELECT TO authenticated
  USING (false);

-- Trigger : à chaque update de auth.users.last_sign_in_at, on logge l'événement.
-- SECURITY DEFINER pour avoir le droit d'écrire dans public depuis le schema auth.
CREATE OR REPLACE FUNCTION public.handle_auth_login()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at AND NEW.last_sign_in_at IS NOT NULL THEN
    INSERT INTO public.auth_login_events (user_id, created_at) VALUES (NEW.id, NEW.last_sign_in_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_login();

-- ============================================================================
-- 3. google_api_costs (saisie manuelle mensuelle)
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_api_costs (
  id              BIGSERIAL PRIMARY KEY,
  period_month    DATE NOT NULL,                  -- 1er du mois (ex: 2026-04-01)
  service         TEXT NOT NULL,                  -- 'places' | 'routes' | 'directions' | autre
  cost_usd        NUMERIC(10, 2) NOT NULL,
  request_count   INTEGER,                        -- optionnel
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (period_month, service)
);

CREATE INDEX IF NOT EXISTS google_api_costs_period_idx ON google_api_costs (period_month DESC);

ALTER TABLE google_api_costs ENABLE ROW LEVEL SECURITY;

-- Tout interdit côté client : seul l'API admin (service_role) gère cette table.
DROP POLICY IF EXISTS google_api_costs_no_access ON google_api_costs;
CREATE POLICY google_api_costs_no_access ON google_api_costs
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.set_updated_at_now()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS google_api_costs_updated_at ON google_api_costs;
CREATE TRIGGER google_api_costs_updated_at
  BEFORE UPDATE ON google_api_costs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();
