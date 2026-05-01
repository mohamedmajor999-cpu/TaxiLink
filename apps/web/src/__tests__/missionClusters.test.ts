import { describe, it, expect } from 'vitest'
import { clusterMissions } from '@/components/dashboard/driver/home/missionClusters'
import type { Mission } from '@/lib/supabase/types'

const mk = (id: string, lat: number | null, lng: number | null, price: number | null = 30): Mission => ({
  id,
  departure_lat: lat,
  departure_lng: lng,
  price_eur: price,
} as unknown as Mission)

describe('clusterMissions', () => {
  it('renvoie un pin pour une annonce isolee', () => {
    const out = clusterMissions([mk('a', 43.2965, 5.3698)])
    expect(out).toHaveLength(1)
    expect(out[0]).toEqual({
      type: 'pin',
      mission: expect.objectContaining({ id: 'a' }),
      position: [43.2965, 5.3698],
    })
  })

  it('ignore les annonces sans coordonnees', () => {
    const out = clusterMissions([mk('a', null, null)])
    expect(out).toHaveLength(0)
  })

  it('groupe les annonces partageant la meme adresse en un stack', () => {
    const out = clusterMissions([
      mk('a', 43.2965, 5.3698, 24),
      mk('b', 43.2965, 5.3698, 31),
      mk('c', 43.2965, 5.3698, 18),
    ])
    expect(out).toHaveLength(1)
    const c = out[0]
    expect(c?.type).toBe('stack')
    if (c?.type === 'stack') {
      expect(c.missions).toHaveLength(3)
      // Leader = prix le plus eleve (offre la plus attractive)
      expect(c.leader.id).toBe('b')
      expect(c.position).toEqual([43.2965, 5.3698])
    }
  })

  it('garde les annonces a adresses distinctes separees', () => {
    const out = clusterMissions([
      mk('a', 43.2965, 5.3698),
      mk('b', 43.5297, 5.4474),
    ])
    expect(out).toHaveLength(2)
    expect(out.every((c) => c.type === 'pin')).toBe(true)
  })

  it('placement stable : meme entree → meme leader', () => {
    const ms = [mk('z', 43.3, 5.4, 50), mk('a', 43.3, 5.4, 50)]
    const out1 = clusterMissions(ms)
    const out2 = clusterMissions(ms.slice().reverse())
    const leader1 = out1[0]?.type === 'stack' ? out1[0].leader.id : null
    const leader2 = out2[0]?.type === 'stack' ? out2[0].leader.id : null
    // Tie-break par id en cas d'egalite de prix
    expect(leader1).toBe('a')
    expect(leader2).toBe('a')
  })
})
