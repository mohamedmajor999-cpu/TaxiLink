import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNoShowDialog, NO_SHOW_REASONS } from '@/components/dashboard/driver/course/useNoShowDialog'

describe('useNoShowDialog', () => {
  it("canSubmit=false tant qu'aucun motif n'est sélectionné", () => {
    const { result } = renderHook(() =>
      useNoShowDialog({ submitting: false, onSubmit: vi.fn() }),
    )
    expect(result.current.canSubmit).toBe(false)
  })

  it('canSubmit=true dès qu\'un motif standard est sélectionné', () => {
    const { result } = renderHook(() =>
      useNoShowDialog({ submitting: false, onSubmit: vi.fn() }),
    )
    act(() => result.current.setSelected('absent'))
    expect(result.current.canSubmit).toBe(true)
  })

  it('appelle onSubmit avec le label du motif standard', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useNoShowDialog({ submitting: false, onSubmit }),
    )
    act(() => result.current.setSelected('absent'))
    act(() => result.current.handleConfirm())
    expect(onSubmit).toHaveBeenCalledWith('Patient absent au point de RDV')
  })

  it('motif "other" exige un texte custom non vide', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useNoShowDialog({ submitting: false, onSubmit }),
    )
    act(() => result.current.setSelected('other'))
    expect(result.current.canSubmit).toBe(false) // pas de texte
    act(() => result.current.setCustomText('   ')) // que des espaces
    expect(result.current.canSubmit).toBe(false)
    act(() => result.current.setCustomText('Patient injoignable'))
    expect(result.current.canSubmit).toBe(true)
    act(() => result.current.handleConfirm())
    expect(onSubmit).toHaveBeenCalledWith('Patient injoignable')
  })

  it('canSubmit=false pendant submitting (anti double-clic)', () => {
    const { result } = renderHook(() =>
      useNoShowDialog({ submitting: true, onSubmit: vi.fn() }),
    )
    act(() => result.current.setSelected('absent'))
    expect(result.current.canSubmit).toBe(false)
  })

  it('expose la liste de motifs (au moins 4 + "Autre")', () => {
    expect(NO_SHOW_REASONS.length).toBeGreaterThanOrEqual(5)
    expect(NO_SHOW_REASONS.some((r) => r.key === 'other')).toBe(true)
  })
})
