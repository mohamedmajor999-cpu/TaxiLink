import { describe, it, expect } from 'vitest'
import { computeCostUsd, getPricing } from '@/lib/aiPricing'

describe('aiPricing', () => {
  it('renvoie le tarif Haiku 4.5', () => {
    expect(getPricing('claude-haiku-4-5')).toEqual({ inputPerMillion: 1, outputPerMillion: 5 })
  })

  it('reconnaît le model id versionné claude-haiku-4-5-20251001', () => {
    expect(getPricing('claude-haiku-4-5-20251001')).toEqual({ inputPerMillion: 1, outputPerMillion: 5 })
  })

  it('renvoie null pour un modèle inconnu', () => {
    expect(getPricing('claude-imaginaire-9-9')).toBeNull()
  })

  it('calcule le coût Haiku 1k in / 1k out → $0.006', () => {
    // 1000 in × 1$/M + 1000 out × 5$/M = 0.001 + 0.005 = 0.006
    expect(computeCostUsd('claude-haiku-4-5', 1000, 1000)).toBeCloseTo(0.006, 6)
  })

  it('calcule le coût Sonnet 4.6 1k in / 500 out', () => {
    // 1000 × 3 + 500 × 15 = 3000 + 7500 = 10500 / 1M = 0.0105
    expect(computeCostUsd('claude-sonnet-4-6', 1000, 500)).toBeCloseTo(0.0105, 6)
  })

  it('renvoie 0 pour modèle inconnu', () => {
    expect(computeCostUsd('inconnu', 1000, 1000)).toBe(0)
  })

  it('renvoie 0 pour 0 tokens', () => {
    expect(computeCostUsd('claude-haiku-4-5', 0, 0)).toBe(0)
  })
})
