import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReasonDialog } from '@/components/dashboard/driver/course/useReasonDialog'

const REASONS = [
  { key: 'delay',   label: 'Retard important' },
  { key: 'address', label: 'Adresse introuvable' },
  { key: 'other',   label: 'Autre' },
] as const

describe('useReasonDialog — état initial', () => {
  it('selected null, customText vide, canSubmit false', () => {
    const { result } = renderHook(() =>
      useReasonDialog({ reasons: REASONS, submitting: false, onSubmit: vi.fn() }),
    )
    expect(result.current.selected).toBeNull()
    expect(result.current.customText).toBe('')
    expect(result.current.canSubmit).toBe(false)
  })
})

describe('useReasonDialog — sélection', () => {
  it('canSubmit true après sélection d\'une raison standard', () => {
    const { result } = renderHook(() =>
      useReasonDialog({ reasons: REASONS, submitting: false, onSubmit: vi.fn() }),
    )
    act(() => result.current.setSelected('delay'))
    expect(result.current.canSubmit).toBe(true)
  })

  it('canSubmit false si "other" sans customText', () => {
    const { result } = renderHook(() =>
      useReasonDialog({ reasons: REASONS, submitting: false, onSubmit: vi.fn() }),
    )
    act(() => result.current.setSelected('other'))
    expect(result.current.canSubmit).toBe(false)
  })

  it('canSubmit true si "other" + customText non vide', () => {
    const { result } = renderHook(() =>
      useReasonDialog({ reasons: REASONS, submitting: false, onSubmit: vi.fn() }),
    )
    act(() => result.current.setSelected('other'))
    act(() => result.current.setCustomText('Précision'))
    expect(result.current.canSubmit).toBe(true)
  })

  it('canSubmit false pendant submitting même si raison choisie', () => {
    const { result } = renderHook(() =>
      useReasonDialog({ reasons: REASONS, submitting: true, onSubmit: vi.fn() }),
    )
    act(() => result.current.setSelected('delay'))
    expect(result.current.canSubmit).toBe(false)
  })
})

describe('useReasonDialog — handleConfirm', () => {
  it('appelle onSubmit avec le label de la raison sélectionnée', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useReasonDialog({ reasons: REASONS, submitting: false, onSubmit }),
    )
    act(() => result.current.setSelected('address'))
    act(() => result.current.handleConfirm())
    expect(onSubmit).toHaveBeenCalledWith('Adresse introuvable')
  })

  it('appelle onSubmit avec le customText (trim) en mode "other"', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useReasonDialog({ reasons: REASONS, submitting: false, onSubmit }),
    )
    act(() => result.current.setSelected('other'))
    act(() => result.current.setCustomText('  Mon motif  '))
    act(() => result.current.handleConfirm())
    expect(onSubmit).toHaveBeenCalledWith('Mon motif')
  })

  it('n\'appelle pas onSubmit si rien sélectionné', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useReasonDialog({ reasons: REASONS, submitting: false, onSubmit }),
    )
    act(() => result.current.handleConfirm())
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
