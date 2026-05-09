import { describe, it, expect, vi } from 'vitest'
import { applyPosterAnswer } from '@/components/dashboard/publier-course/posterAnswerApplier'
import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'

vi.mock('@/components/dashboard/driver/smartAddressLookup', () => ({
  smartAddressLookup: vi.fn(async (q: string) => ({ label: q, lat: 0, lng: 0 })),
}))

function makeForm(overrides: Partial<MissionFormState> = {}): MissionFormState {
  return {
    setType: vi.fn(),
    setMedicalMotif: vi.fn(),
    setReturnTrip: vi.fn(),
    setPassengers: vi.fn(),
    setDate: vi.fn(),
    setTime: vi.fn(),
    setPhone: vi.fn(),
    setDeparture: vi.fn(),
    setDestination: vi.fn(),
    setVisibility: vi.fn(),
    setGroupIds: vi.fn(),
    ...overrides,
  } as unknown as MissionFormState
}

describe("posterAnswerApplier — bascule when='later' sur date/time", () => {
  it("date dictee en relance vocale appelle setWhenLater", async () => {
    const form = makeForm()
    const setWhenLater = vi.fn()
    const ok = await applyPosterAnswer('date', '2026-05-15', {
      form, setDepartureCoords: vi.fn(), setDestinationCoords: vi.fn(), setWhenLater,
    })
    expect(ok).toBe(true)
    expect(form.setDate).toHaveBeenCalledWith('2026-05-15')
    expect(setWhenLater).toHaveBeenCalledTimes(1)
  })

  it("heure dictee en relance vocale appelle setWhenLater", async () => {
    const form = makeForm()
    const setWhenLater = vi.fn()
    const ok = await applyPosterAnswer('time', '14:30', {
      form, setDepartureCoords: vi.fn(), setDestinationCoords: vi.fn(), setWhenLater,
    })
    expect(ok).toBe(true)
    expect(form.setTime).toHaveBeenCalledWith('14:30')
    expect(setWhenLater).toHaveBeenCalledTimes(1)
  })

  it("date au mauvais format n'appelle pas setWhenLater", async () => {
    const form = makeForm()
    const setWhenLater = vi.fn()
    const ok = await applyPosterAnswer('date', '15/05/2026', {
      form, setDepartureCoords: vi.fn(), setDestinationCoords: vi.fn(), setWhenLater,
    })
    expect(ok).toBe(false)
    expect(form.setDate).not.toHaveBeenCalled()
    expect(setWhenLater).not.toHaveBeenCalled()
  })

  it("setWhenLater optionnel : si non fourni, pas d'erreur", async () => {
    const form = makeForm()
    const ok = await applyPosterAnswer('date', '2026-05-15', {
      form, setDepartureCoords: vi.fn(), setDestinationCoords: vi.fn(),
    })
    expect(ok).toBe(true)
    expect(form.setDate).toHaveBeenCalledWith('2026-05-15')
  })

  it("phone dictee n'appelle pas setWhenLater (aucun rapport au mode quand)", async () => {
    const form = makeForm()
    const setWhenLater = vi.fn()
    const ok = await applyPosterAnswer('phone', '0612345678', {
      form, setDepartureCoords: vi.fn(), setDestinationCoords: vi.fn(), setWhenLater,
    })
    expect(ok).toBe(true)
    expect(setWhenLater).not.toHaveBeenCalled()
  })

  it("type CPAM dictee : applique mais ne touche pas le when", async () => {
    const form = makeForm()
    const setWhenLater = vi.fn()
    const ok = await applyPosterAnswer('type', 'CPAM', {
      form, setDepartureCoords: vi.fn(), setDestinationCoords: vi.fn(), setWhenLater,
    })
    expect(ok).toBe(true)
    expect(form.setType).toHaveBeenCalledWith('CPAM')
    expect(setWhenLater).not.toHaveBeenCalled()
  })
})
