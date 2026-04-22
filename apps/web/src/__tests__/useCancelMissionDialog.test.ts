import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useCancelMissionDialog,
  CANCEL_REASONS,
} from '@/components/dashboard/driver/course/useCancelMissionDialog'

describe('useCancelMissionDialog — état initial', () => {
  it('selected est null, canSubmit est false', () => {
    const { result } = renderHook(() =>
      useCancelMissionDialog({ submitting: false, onSubmit: vi.fn() }),
    )
    expect(result.current.selected).toBeNull()
    expect(result.current.canSubmit).toBe(false)
    expect(result.current.effective).toBe('')
  })
})

describe('useCancelMissionDialog — sélection de raison', () => {
  it('effective = label de la raison choisie', () => {
    const { result } = renderHook(() =>
      useCancelMissionDialog({ submitting: false, onSubmit: vi.fn() }),
    )
    act(() => { result.current.setSelected('delay') })
    expect(result.current.effective).toBe('Retard important')
    expect(result.current.canSubmit).toBe(true)
  })

  it("effective = customText.trim() quand selected='other'", () => {
    const { result } = renderHook(() =>
      useCancelMissionDialog({ submitting: false, onSubmit: vi.fn() }),
    )
    act(() => { result.current.setSelected('other') })
    act(() => { result.current.setCustomText('  raison libre  ') })
    expect(result.current.effective).toBe('raison libre')
    expect(result.current.canSubmit).toBe(true)
  })

  it("canSubmit est false si selected='other' et customText vide", () => {
    const { result } = renderHook(() =>
      useCancelMissionDialog({ submitting: false, onSubmit: vi.fn() }),
    )
    act(() => { result.current.setSelected('other') })
    expect(result.current.canSubmit).toBe(false)
  })

  it('canSubmit est false si submitting=true même avec effective', () => {
    const { result } = renderHook(() =>
      useCancelMissionDialog({ submitting: true, onSubmit: vi.fn() }),
    )
    act(() => { result.current.setSelected('vehicle') })
    expect(result.current.canSubmit).toBe(false)
  })
})

describe('useCancelMissionDialog — handleConfirm', () => {
  it('appelle onSubmit avec le label de la raison', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useCancelMissionDialog({ submitting: false, onSubmit }),
    )
    act(() => { result.current.setSelected('vehicle') })
    act(() => { result.current.handleConfirm() })
    expect(onSubmit).toHaveBeenCalledWith('Véhicule immobilisé')
  })

  it("n'appelle pas onSubmit si effective est vide", () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useCancelMissionDialog({ submitting: false, onSubmit }),
    )
    act(() => { result.current.handleConfirm() })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("appelle onSubmit avec customText quand selected='other'", () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useCancelMissionDialog({ submitting: false, onSubmit }),
    )
    act(() => { result.current.setSelected('other') })
    act(() => { result.current.setCustomText('ma raison') })
    act(() => { result.current.handleConfirm() })
    expect(onSubmit).toHaveBeenCalledWith('ma raison')
  })
})

describe('CANCEL_REASONS', () => {
  it('exporte 5 raisons de valeurs différentes', () => {
    expect(CANCEL_REASONS).toHaveLength(5)
    const keys = CANCEL_REASONS.map((r) => r.key)
    expect(new Set(keys).size).toBe(5)
  })
})
