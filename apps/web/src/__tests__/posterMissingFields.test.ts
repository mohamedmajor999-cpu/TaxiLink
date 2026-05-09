import { describe, it, expect } from 'vitest'
import { getPosterMissingFields } from '@/components/dashboard/publier-course/posterMissingFields'
import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'

function form(overrides: Partial<MissionFormState> = {}): MissionFormState {
  return {
    type: 'PRIVE',
    departure: '12 rue de Rivoli, Paris',
    destination: '5 av. de Lyon, Lyon',
    phone: '',
    medicalMotif: null,
    visibility: 'PUBLIC',
    groupIds: [],
    ...overrides,
  } as unknown as MissionFormState
}

describe('posterMissingFields — bornes', () => {
  it('pose date/time quand whenMode=later (default)', () => {
    const fields = getPosterMissingFields(form(), { parsedFields: new Set() })
    const ids = fields.map((f) => f.id)
    expect(ids).toContain('date')
    expect(ids).toContain('time')
  })

  it("ne pose PAS date/time quand whenMode='now'", () => {
    const fields = getPosterMissingFields(form(), { parsedFields: new Set(), whenMode: 'now' })
    const ids = fields.map((f) => f.id)
    expect(ids).not.toContain('date')
    expect(ids).not.toContain('time')
  })

  it("pose phone meme en whenMode='now' (independant)", () => {
    const fields = getPosterMissingFields(form({ phone: '' }), { parsedFields: new Set(), whenMode: 'now' })
    expect(fields.map((f) => f.id)).toContain('phone')
  })

  it('skip date si parsedFields la contient deja', () => {
    const fields = getPosterMissingFields(form(), { parsedFields: new Set(['date']) })
    expect(fields.map((f) => f.id)).not.toContain('date')
  })

  it('CPAM ajoute medicalMotif/returnTrip/passengers', () => {
    const fields = getPosterMissingFields(form({ type: 'CPAM' }), { parsedFields: new Set() })
    const ids = fields.map((f) => f.id)
    expect(ids).toContain('medicalMotif')
    expect(ids).toContain('returnTrip')
    expect(ids).toContain('passengers')
  })

  it('GROUP avec 0 groupIds → demande groupIds', () => {
    const fields = getPosterMissingFields(form({ visibility: 'GROUP', groupIds: [] }), { parsedFields: new Set() })
    expect(fields.map((f) => f.id)).toContain('groupIds')
  })
})
