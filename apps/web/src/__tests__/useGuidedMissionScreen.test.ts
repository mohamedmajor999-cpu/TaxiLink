import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGuidedMissionScreen } from '@/components/dashboard/driver/guided/useGuidedMissionScreen'
import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import type { GuidedQuestion } from '@/components/dashboard/driver/guided/guidedTypes'

// ─── Mocks des sous-hooks ─────────────────────────────────────────────────────
const mockApply = vi.fn().mockResolvedValue(undefined)
const mockFlowAnswer = vi.fn().mockResolvedValue(undefined)
const mockVoiceStop = vi.fn()
const mockPromptStop = vi.fn()

const mockFlowCurrentQuestion: GuidedQuestion = {
  id: 'type', category: 'type', prompt: 'CPAM ?', shortLabel: 'Type',
  kind: 'choice', isVisible: () => true,
}

vi.mock('@/components/dashboard/driver/guided/useGuidedAnswerApplier', () => ({
  useGuidedAnswerApplier: vi.fn(() => mockApply),
}))

const mockFlow = {
  currentQuestion: mockFlowCurrentQuestion,
  currentIndex: 0, totalQuestions: 8, visibleQuestions: [],
  progress: 0.125, isComplete: false,
  answer: (...a: unknown[]) => mockFlowAnswer(...a),
  skip: vi.fn(), back: vi.fn(), goTo: vi.fn(),
  handleVoiceResult: vi.fn(),
}

vi.mock('@/components/dashboard/driver/guided/useGuidedMissionFlow', () => ({
  useGuidedMissionFlow: vi.fn(() => mockFlow),
}))

vi.mock('@/components/dashboard/driver/guided/useGuidedVoicePrompt', () => ({
  useGuidedVoicePrompt: vi.fn(() => ({
    speak: vi.fn().mockResolvedValue(undefined),
    stop: mockPromptStop,
    isSpeaking: false,
    isSupported: false,
    voiceName: null,
  })),
}))

vi.mock('@/components/dashboard/driver/guided/useGuidedVoiceAnswer', () => ({
  useGuidedVoiceAnswer: vi.fn(() => ({
    isSupported: false, isListening: false, isProcessing: false,
    interimTranscript: '', error: null,
    start: vi.fn(), stop: mockVoiceStop,
  })),
}))

vi.mock('@/components/dashboard/driver/guided/useGuidedTtsAnnouncer', () => ({
  useGuidedTtsAnnouncer: vi.fn(() => 'type'),
}))

vi.mock('@/components/dashboard/driver/guided/playBeep', () => ({
  playBeep: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/components/dashboard/driver/guided/guidedInitialValue', () => ({
  initialValueForQuestion: vi.fn((id: string) => id === 'type' ? 'PRIVE' : null),
}))

function makeForm(overrides: Partial<MissionFormState> = {}): MissionFormState {
  return {
    type: 'PRIVE', medicalMotif: null, transportType: null,
    returnTrip: false, returnTime: null, companion: false, passengers: null,
    visibility: 'PUBLIC', groupIds: [],
    departure: '', destination: '', price: '', priceMin: '', priceMax: '',
    patientName: '', phone: '', notes: '', date: '', time: '', scheduledAt: null,
    setType: vi.fn(), setMedicalMotif: vi.fn(), setTransportType: vi.fn(),
    setReturnTrip: vi.fn(), setReturnTime: vi.fn(), setCompanion: vi.fn(),
    setPassengers: vi.fn(), setVisibility: vi.fn(), setGroupIds: vi.fn(),
    setDeparture: vi.fn(), setDestination: vi.fn(), setPrice: vi.fn(),
    setPriceMin: vi.fn(), setPriceMax: vi.fn(), setPatientName: vi.fn(),
    setPhone: vi.fn(), setNotes: vi.fn(), setDate: vi.fn(), setTime: vi.fn(),
    setScheduledAt: vi.fn(),
    ...overrides,
  } as unknown as MissionFormState
}

function makeOpts(overrides = {}) {
  return {
    form: makeForm(),
    myGroups: [],
    setters: {} as never,
    allQuestionIds: ['type', 'phone'],
    voiceAutoSpeak: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFlowAnswer.mockResolvedValue(undefined)
  mockFlow.isComplete = false
  mockFlow.currentQuestion = mockFlowCurrentQuestion
})

// ─── draft ────────────────────────────────────────────────────────────────────
describe('useGuidedMissionScreen — draft', () => {
  it('draft est initialisé depuis initialValueForQuestion', () => {
    const { result } = renderHook(() => useGuidedMissionScreen(makeOpts()))
    // initialValueForQuestion('type') → 'PRIVE'
    expect(result.current.draft).toBe('PRIVE')
  })

  it('setDraft met à jour le draft', () => {
    const { result } = renderHook(() => useGuidedMissionScreen(makeOpts()))
    act(() => { result.current.setDraft('CPAM') })
    expect(result.current.draft).toBe('CPAM')
  })
})

// ─── canSubmitDraft ───────────────────────────────────────────────────────────
describe('useGuidedMissionScreen — canSubmitDraft', () => {
  it("canSubmitDraft=true si draft est valide pour question 'choice'", () => {
    const { result } = renderHook(() => useGuidedMissionScreen(makeOpts()))
    // draft='PRIVE' est une string non-vide → isDraftValid(choice, 'PRIVE') = true
    expect(result.current.canSubmitDraft).toBe(true)
  })

  it("canSubmitDraft=false si draft est null et question non-optionnelle", () => {
    const { result } = renderHook(() => useGuidedMissionScreen(makeOpts()))
    act(() => { result.current.setDraft(null) })
    expect(result.current.canSubmitDraft).toBe(false)
  })
})

// ─── submitDraft ──────────────────────────────────────────────────────────────
describe('useGuidedMissionScreen — submitDraft', () => {
  it('submitDraft appelle flow.answer avec le draft courant', async () => {
    const { result } = renderHook(() => useGuidedMissionScreen(makeOpts()))
    act(() => { result.current.setDraft('CPAM') })
    await act(async () => { await result.current.submitDraft() })
    expect(mockFlowAnswer).toHaveBeenCalledWith('CPAM')
  })
})

// ─── autoCommit ───────────────────────────────────────────────────────────────
describe('useGuidedMissionScreen — autoCommit', () => {
  it('autoCommit met draft et appelle flow.answer', async () => {
    const { result } = renderHook(() => useGuidedMissionScreen(makeOpts()))
    await act(async () => { await result.current.autoCommit('GROUP') })
    expect(result.current.draft).toBe('GROUP')
    expect(mockFlowAnswer).toHaveBeenCalledWith('GROUP')
  })
})

// ─── voiceSession ─────────────────────────────────────────────────────────────
describe('useGuidedMissionScreen — voiceSession', () => {
  it('voiceSession est false par défaut', () => {
    const { result } = renderHook(() => useGuidedMissionScreen(makeOpts()))
    expect(result.current.voiceSession).toBe(false)
  })

  it('startVoiceSession passe voiceSession à true', () => {
    const { result } = renderHook(() => useGuidedMissionScreen(makeOpts()))
    act(() => { result.current.startVoiceSession() })
    expect(result.current.voiceSession).toBe(true)
  })

  it('stopVoiceSession remet voiceSession à false et arrête la voix', () => {
    const { result } = renderHook(() => useGuidedMissionScreen(makeOpts()))
    act(() => { result.current.startVoiceSession() })
    act(() => { result.current.stopVoiceSession() })
    expect(result.current.voiceSession).toBe(false)
    expect(mockVoiceStop).toHaveBeenCalled()
    expect(mockPromptStop).toHaveBeenCalled()
  })
})
