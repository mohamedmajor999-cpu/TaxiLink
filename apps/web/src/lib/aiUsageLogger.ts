import { createServerSupabaseClient } from '@/lib/supabase/server'
import { computeCostUsd } from '@/lib/aiPricing'

interface LogAiUsageInput {
  endpoint:      string
  model:         string
  inputTokens:   number
  outputTokens:  number
}

// Logge un appel LLM dans la table ai_usage. Best-effort : si l'insert echoue,
// on log l'erreur mais on ne propage pas (la conso est secondaire vs le resultat
// de la route appelante).
export async function logAiUsage(input: LogAiUsageInput): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cost = computeCostUsd(input.model, input.inputTokens, input.outputTokens)
    const { error } = await supabase.from('ai_usage').insert({
      user_id:        user?.id ?? null,
      endpoint:       input.endpoint,
      model:          input.model,
      input_tokens:   input.inputTokens,
      output_tokens:  input.outputTokens,
      cost_usd:       cost,
    })
    if (error) console.error('[aiUsageLogger] insert failed', error.message)
  } catch (err) {
    console.error('[aiUsageLogger] unexpected', (err as Error).message)
  }
}
