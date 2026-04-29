// Tarifs des modèles IA, en USD par million de tokens.
// Source : https://www.anthropic.com/pricing (mise à jour : 2026-04-29).

export interface ModelPricing {
  inputPerMillion:  number
  outputPerMillion: number
}

const PRICING: Record<string, ModelPricing> = {
  'claude-haiku-4-5':           { inputPerMillion: 1,  outputPerMillion: 5  },
  'claude-haiku-4-5-20251001':  { inputPerMillion: 1,  outputPerMillion: 5  },
  'claude-sonnet-4-6':          { inputPerMillion: 3,  outputPerMillion: 15 },
  'claude-opus-4-7':            { inputPerMillion: 15, outputPerMillion: 75 },
}

export function getPricing(model: string): ModelPricing | null {
  return PRICING[model] ?? null
}

export function computeCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = getPricing(model)
  if (!p) return 0
  return (inputTokens * p.inputPerMillion + outputTokens * p.outputPerMillion) / 1_000_000
}
