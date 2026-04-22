import { describe, it, expect, beforeEach } from 'vitest'
import { usePostedAcceptStore, type AcceptedMissionInfo } from '@/store/postedAcceptStore'

function makeInfo(id: string, overrides: Partial<AcceptedMissionInfo> = {}): AcceptedMissionInfo {
  return {
    missionId: id,
    departure: 'Marseille',
    destination: 'Aix-en-Provence',
    acceptedAt: new Date().toISOString(),
    driverName: 'Jean Dupont',
    driverPhone: '0600000000',
    ...overrides,
  }
}

describe('postedAcceptStore', () => {
  beforeEach(() => {
    usePostedAcceptStore.getState().reset()
  })

  it('initial state : unseen vide, popup null', () => {
    const s = usePostedAcceptStore.getState()
    expect(s.unseen).toEqual({})
    expect(s.popup).toBeNull()
  })

  it("add() pousse la mission dans unseen et ouvre le popup", () => {
    const info = makeInfo('m1')
    usePostedAcceptStore.getState().add(info)
    const s = usePostedAcceptStore.getState()
    expect(s.unseen['m1']).toEqual(info)
    expect(s.popup).toEqual(info)
  })

  it("add() est idempotent — même missionId = pas de doublon, pas de réouverture", () => {
    const info = makeInfo('m1')
    usePostedAcceptStore.getState().add(info)
    usePostedAcceptStore.getState().dismissPopup()
    usePostedAcceptStore.getState().add(info)
    const s = usePostedAcceptStore.getState()
    expect(Object.keys(s.unseen)).toHaveLength(1)
    expect(s.popup).toBeNull()
  })

  it('dismissPopup() ferme le popup mais garde la mission dans unseen (badge)', () => {
    usePostedAcceptStore.getState().add(makeInfo('m1'))
    usePostedAcceptStore.getState().dismissPopup()
    const s = usePostedAcceptStore.getState()
    expect(s.popup).toBeNull()
    expect(s.unseen['m1']).toBeTruthy()
  })

  it('clearUnseen() vide les missions non vues mais garde le popup courant', () => {
    usePostedAcceptStore.getState().add(makeInfo('m1'))
    usePostedAcceptStore.getState().clearUnseen()
    const s = usePostedAcceptStore.getState()
    expect(s.unseen).toEqual({})
    expect(s.popup).not.toBeNull()
  })

  it('reset() remet tout à zéro', () => {
    usePostedAcceptStore.getState().add(makeInfo('m1'))
    usePostedAcceptStore.getState().reset()
    const s = usePostedAcceptStore.getState()
    expect(s.unseen).toEqual({})
    expect(s.popup).toBeNull()
  })

  it('plusieurs missions uniques sont cumulées (popup = dernière arrivée)', () => {
    usePostedAcceptStore.getState().add(makeInfo('m1'))
    usePostedAcceptStore.getState().add(makeInfo('m2', { driverName: 'Alice' }))
    const s = usePostedAcceptStore.getState()
    expect(Object.keys(s.unseen)).toHaveLength(2)
    expect(s.popup?.missionId).toBe('m2')
  })
})
