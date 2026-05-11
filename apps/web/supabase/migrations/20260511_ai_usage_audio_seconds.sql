-- Tracker la duree audio Whisper dans ai_usage.
--
-- Whisper-1 facture a la seconde audio (~$0.006/min = $0.0001/sec), pas en
-- tokens. Sans cette colonne, le dashboard admin sous-estimait la facture
-- OpenAI (les appels Whisper s'inscrivaient avec input_tokens=0,
-- output_tokens=0, cost_usd=0 -> totalement invisible).
--
-- Pour les modeles token-based (GPT-mini, Claude), audio_seconds reste null
-- et la facture est calculee classiquement via input/output tokens.
--
-- Appliquee en prod 2026-05-11 via MCP.

ALTER TABLE public.ai_usage
  ADD COLUMN IF NOT EXISTS audio_seconds NUMERIC;
