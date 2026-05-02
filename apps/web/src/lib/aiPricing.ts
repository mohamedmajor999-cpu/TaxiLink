// Tarifs des modèles IA, en USD par million de tokens.
// Sources : https://www.anthropic.com/pricing, https://openai.com/api/pricing (2026-05-03).

export interface ModelPricing {
  inputPerMillion:  number
  outputPerMillion: number
}

const PRICING: Record<string, ModelPricing> = {
  'claude-haiku-4-5':           { inputPerMillion: 1,    outputPerMillion: 5    },
  'claude-haiku-4-5-20251001':  { inputPerMillion: 1,    outputPerMillion: 5    },
  'claude-sonnet-4-6':          { inputPerMillion: 3,    outputPerMillion: 15   },
  'claude-opus-4-7':            { inputPerMillion: 15,   outputPerMillion: 75   },
  'gpt-4o-mini':                { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  'whisper-1':                  { inputPerMillion: 0,    outputPerMillion: 0    },
}

export function getPricing(model: string): ModelPricing | null {
  return PRICING[model] ?? null
}

export function computeCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = getPricing(model)
  if (!p) return 0
  return (inputTokens * p.inputPerMillion + outputTokens * p.outputPerMillion) / 1_000_000
}
