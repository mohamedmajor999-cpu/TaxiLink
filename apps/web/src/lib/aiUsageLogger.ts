import { createServerSupabaseClient } from '@/lib/supabase/server'
import { computeCostUsd } from '@/lib/aiPricing'

interface LogAiUsageInput {
  endpoint:      string
  model:         string
  inputTokens?:  number
  outputTokens?: number
  // Pour Whisper : duree audio en secondes (facture $0.006/min). Les modeles
  // token-based laissent ce champ undefined.
  audioSeconds?: number
}

// Logge un appel LLM dans la table ai_usage. Best-effort : si l'insert echoue,
// on log l'erreur mais on ne propage pas (la conso est secondaire vs le resultat
// de la route appelante).
export async function logAiUsage(input: LogAiUsageInput): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const inputTokens  = input.inputTokens  ?? 0
    const outputTokens = input.outputTokens ?? 0
    const audioSeconds = input.audioSeconds ?? 0
    const cost = computeCostUsd(input.model, inputTokens, outputTokens, audioSeconds)
    const { error } = await supabase.from('ai_usage').insert({
      user_id:        user?.id ?? null,
      endpoint:       input.endpoint,
      model:          input.model,
      input_tokens:   inputTokens,
      output_tokens:  outputTokens,
      audio_seconds:  input.audioSeconds ?? null,
      cost_usd:       cost,
    })
    if (error) console.error('[aiUsageLogger] insert failed', error.message)
  } catch (err) {
    console.error('[aiUsageLogger] unexpected', (err as Error).message)
  }
}
