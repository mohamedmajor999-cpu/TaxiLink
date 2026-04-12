import { describe, it, expect, beforeEach } from 'vitest'
import { useMissionStore } from '@/store/missionStore'

// Reset le store avant chaque test
beforeEach(() => {
  useMissionStore.setState({
    missions: [
      {
        id: 'm1',
        type: 'CPAM',
        status: 'AVAILABLE',
        departure: '10 rue de la Paix, Paris',
        destination: 'Hôpital Lariboisière, Paris',
        distanceKm: 3.2,
        priceEur: 18.5,
        patientName: 'Jean Dupont',
        phone: '0601020304',
        scheduledAt: new Date(Date.now() + 30 * 60000).toISOString(),
        driverId: undefined,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'm2',
        type: 'PRIVE',
        status: 'AVAILABLE',
        departure: 'Gare du Nord, Paris',
        destination: 'Aéroport CDG',
        distanceKm: 28.5,
        priceEur: 65.0,
        patientName: undefined,
        phone: '0607080910',
        scheduledAt: new Date(Date.now() + 60 * 60000).toISOString(),
        driverId: undefined,
        createdAt: new Date().toISOString(),
      },
    ],
    currentMission: null,
    sortField: null,
    sortDir: 'none',
  })
})

// ─── État initial ─────────────────────────────────────────────────────────────
describe('useMissionStore — état initial', () => {
  it('contient 2 missions après reset', () => {
    const { missions } = useMissionStore.getState()
    expect(missions).toHaveLength(2)
  })

  it('n\'a pas de mission en cours au départ', () => {
    const { currentMission } = useMissionStore.getState()
    expect(currentMission).toBeNull()
  })
})

// ─── acceptMission ────────────────────────────────────────────────────────────
describe('acceptMission', () => {
  it('déplace la mission dans currentMission', () => {
    useMissionStore.getState().acceptMission('m1')
    const { currentMission } = useMissionStore.getState()
    expect(currentMission).not.toBeNull()
    expect(currentMission?.id).toBe('m1')
  })

  it('passe le statut à IN_PROGRESS', () => {
    useMissionStore.getState().acceptMission('m1')
    const { currentMission } = useMissionStore.getState()
    expect(currentMission?.status).toBe('IN_PROGRESS')
  })

  it('retire la mission de la liste disponible', () => {
    useMissionStore.getState().acceptMission('m1')
    const { missions } = useMissionStore.getState()
    expect(missions.find(m => m.id === 'm1')).toBeUndefined()
  })

  it('ne fait rien pour un id inexistant', () => {
    useMissionStore.getState().acceptMission('inexistant')
    const { currentMission, missions } = useMissionStore.getState()
    expect(currentMission).toBeNull()
    expect(missions).toHaveLength(2)
  })
})

// ─── completeMission ──────────────────────────────────────────────────────────
describe('completeMission', () => {
  it('vide currentMission', () => {
    useMissionStore.getState().acceptMission('m1')
    useMissionStore.getState().completeMission()
    const { currentMission } = useMissionStore.getState()
    expect(currentMission).toBeNull()
  })
})

// ─── dismissCurrentMission ────────────────────────────────────────────────────
describe('dismissCurrentMission', () => {
  it('vide currentMission', () => {
    useMissionStore.getState().acceptMission('m1')
    useMissionStore.getState().dismissCurrentMission()
    expect(useMissionStore.getState().currentMission).toBeNull()
  })
})

// ─── toggleSort ───────────────────────────────────────────────────────────────
describe('toggleSort', () => {
  it('passe de none à asc sur premier appel', () => {
    useMissionStore.getState().toggleSort('price')
    const { sortField, sortDir } = useMissionStore.getState()
    expect(sortField).toBe('price')
    expect(sortDir).toBe('asc')
  })

  it('passe de asc à desc sur deuxième appel', () => {
    useMissionStore.getState().toggleSort('price')
    useMissionStore.getState().toggleSort('price')
    expect(useMissionStore.getState().sortDir).toBe('desc')
  })

  it('passe de desc à none sur troisième appel', () => {
    useMissionStore.getState().toggleSort('price')
    useMissionStore.getState().toggleSort('price')
    useMissionStore.getState().toggleSort('price')
    expect(useMissionStore.getState().sortDir).toBe('none')
  })

  it('reset à asc si on change de champ', () => {
    useMissionStore.getState().toggleSort('price')
    useMissionStore.getState().toggleSort('distance')
    const { sortField, sortDir } = useMissionStore.getState()
    expect(sortField).toBe('distance')
    expect(sortDir).toBe('asc')
  })
})
