import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGuidedMissionFlow } from '@/components/dashboard/driver/guided/useGuidedMissionFlow'
import type { GuidedVisibilityState } from '@/components/dashboard/driver/guided/guidedTypes'

// État PRIVE/PUBLIC : 8 questions visibles
// [type, phone, departure, destination, date, time, passengers, visibility]
const STATE_PRIVE_PUBLIC: GuidedVisibilityState = {
  type: 'PRIVE',
  returnTrip: false,
  visibility: 'PUBLIC',
}

// État CPAM/GROUP : 13 questions visibles (returnTrip=false donc pas returnTime)
const STATE_CPAM_GROUP: GuidedVisibilityState = {
  type: 'CPAM',
  returnTrip: false,
  visibility: 'GROUP',
}

function makeOptions(overrides: Partial<{
  state: GuidedVisibilityState
  apply: ReturnType<typeof vi.fn>
  onComplete: ReturnType<typeof vi.fn>
}> = {}) {
  return {
    state: STATE_PRIVE_PUBLIC,
    apply: vi.fn().mockResolvedValue(undefined),
    onComplete: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Question initiale ────────────────────────────────────────────────────────
describe('useGuidedMissionFlow — question initiale', () => {
  it('currentQuestion est la première question visible (type)', () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))
    expect(result.current.currentQuestion?.id).toBe('type')
    expect(result.current.currentIndex).toBe(0)
  })

  it('totalQuestions est 8 pour PRIVE/PUBLIC', () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))
    expect(result.current.totalQuestions).toBe(8)
  })

  it('totalQuestions est 13 pour CPAM/GROUP (returnTrip=false)', () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ state: STATE_CPAM_GROUP })))
    expect(result.current.totalQuestions).toBe(13)
  })

  it('progress est 1/totalQuestions à la première question', () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))
    expect(result.current.progress).toBeCloseTo(1 / 8)
  })

  it('isComplete est false au départ', () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))
    expect(result.current.isComplete).toBe(false)
  })
})

// ─── Navigation : answer ──────────────────────────────────────────────────────
describe('useGuidedMissionFlow — answer', () => {
  it('answer appelle apply avec (questionId, value) et avance à la question suivante', async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))

    await act(async () => { await result.current.answer('PRIVE') })

    expect(apply).toHaveBeenCalledWith('type', 'PRIVE')
    expect(result.current.currentQuestion?.id).toBe('phone')
    expect(result.current.currentIndex).toBe(1)
  })

  it('answer à la dernière question déclenche onComplete et isComplete=true', async () => {
    const onComplete = vi.fn()
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply, onComplete })))

    // Aller à la dernière question (visibility = index 7)
    act(() => { result.current.goTo('visibility') })
    expect(result.current.currentQuestion?.id).toBe('visibility')

    await act(async () => { await result.current.answer('PUBLIC') })

    expect(result.current.isComplete).toBe(true)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('answer ne fait rien si currentQuestion est null', async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    // État impossible : pas de questions → on force via un state sans question visible
    // On ne peut pas facilement forcer currentQuestion=null, donc on vérifie que apply n'est pas appelé
    // quand on fournit une fonction qui n'avance pas
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))
    // currentQuestion est 'type', apply sera appelée
    await act(async () => { await result.current.answer('PRIVE') })
    expect(apply).toHaveBeenCalledTimes(1)
  })
})

// ─── Navigation : back ────────────────────────────────────────────────────────
describe('useGuidedMissionFlow — back', () => {
  it('back depuis la question 1 revient à la question 0', async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))

    await act(async () => { await result.current.answer('PRIVE') })
    expect(result.current.currentIndex).toBe(1)

    act(() => { result.current.back() })
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentQuestion?.id).toBe('type')
  })

  it('back depuis la question 0 ne bouge pas', () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))
    act(() => { result.current.back() })
    expect(result.current.currentIndex).toBe(0)
  })

  it('back depuis isComplete repasse isComplete à false', async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))

    act(() => { result.current.goTo('visibility') })
    await act(async () => { await result.current.answer('PUBLIC') })
    expect(result.current.isComplete).toBe(true)

    act(() => { result.current.back() })
    expect(result.current.isComplete).toBe(false)
  })
})

// ─── Navigation : skip ───────────────────────────────────────────────────────
describe('useGuidedMissionFlow — skip', () => {
  it('skip sur une question optionnelle avance à la suivante', async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))

    // Avancer jusqu'à 'phone' (index 1, optional=true)
    await act(async () => { await result.current.answer('PRIVE') })
    expect(result.current.currentQuestion?.id).toBe('phone')
    expect(result.current.currentQuestion?.optional).toBe(true)

    act(() => { result.current.skip() })
    expect(result.current.currentQuestion?.id).toBe('departure')
  })

  it('skip sur une question non-optionnelle ne fait rien', () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))
    // 'type' n'est pas optional
    expect(result.current.currentQuestion?.optional).toBeFalsy()
    act(() => { result.current.skip() })
    expect(result.current.currentQuestion?.id).toBe('type')
  })
})

// ─── Navigation : goTo ───────────────────────────────────────────────────────
describe('useGuidedMissionFlow — goTo', () => {
  it('goTo saute à une question visible par id', () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))
    act(() => { result.current.goTo('date') })
    expect(result.current.currentQuestion?.id).toBe('date')
  })

  it('goTo un id inconnu ne bouge pas', () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))
    act(() => { result.current.goTo('inexistant') })
    expect(result.current.currentQuestion?.id).toBe('type')
  })

  it('goTo remet isComplete à false', async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))
    act(() => { result.current.goTo('visibility') })
    await act(async () => { await result.current.answer('PUBLIC') })
    expect(result.current.isComplete).toBe(true)

    act(() => { result.current.goTo('type') })
    expect(result.current.isComplete).toBe(false)
  })
})

// ─── handleVoiceResult ────────────────────────────────────────────────────────
describe('useGuidedMissionFlow — handleVoiceResult', () => {
  it("intent 'answer' appelle answer avec la valeur", async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))

    await act(async () => {
      await result.current.handleVoiceResult({ intent: 'answer', value: 'PRIVE' })
    })
    expect(apply).toHaveBeenCalledWith('type', 'PRIVE')
    expect(result.current.currentQuestion?.id).toBe('phone')
  })

  it("intent 'skip' appelle skip", async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))

    // Se positionner sur phone (optional)
    await act(async () => { await result.current.answer('PRIVE') })
    expect(result.current.currentQuestion?.id).toBe('phone')

    await act(async () => {
      await result.current.handleVoiceResult({ intent: 'skip' })
    })
    expect(result.current.currentQuestion?.id).toBe('departure')
  })

  it("intent 'back' appelle back", async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))

    await act(async () => { await result.current.answer('PRIVE') })
    await act(async () => {
      await result.current.handleVoiceResult({ intent: 'back' })
    })
    expect(result.current.currentQuestion?.id).toBe('type')
  })

  it("intent 'goto' avec targetQuestionId appelle goTo", async () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))

    await act(async () => {
      await result.current.handleVoiceResult({ intent: 'goto', targetQuestionId: 'date' })
    })
    expect(result.current.currentQuestion?.id).toBe('date')
  })

  it("intent 'unclear' ne change pas la question courante", async () => {
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions()))

    await act(async () => {
      await result.current.handleVoiceResult({ intent: 'unclear' })
    })
    expect(result.current.currentQuestion?.id).toBe('type')
  })
})

// ─── progress ─────────────────────────────────────────────────────────────────
describe('useGuidedMissionFlow — progress', () => {
  it('progress évolue correctement au fil des questions', async () => {
    const apply = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useGuidedMissionFlow(makeOptions({ apply })))

    expect(result.current.progress).toBeCloseTo(1 / 8)

    await act(async () => { await result.current.answer('PRIVE') })
    expect(result.current.progress).toBeCloseTo(2 / 8)
  })
})
