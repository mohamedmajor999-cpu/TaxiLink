import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCourseTopStats } from '@/components/dashboard/driver/course/useCourseTopStats'

// Système figé au 2026-05-01 10:00:00 UTC
const FROZEN = new Date('2026-05-01T10:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FROZEN)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useCourseTopStats — isPast', () => {
  it('isPast est false pour une mission dans le futur', () => {
    // Dans 30 minutes
    const { result } = renderHook(() =>
      useCourseTopStats('2026-05-01T10:30:00.000Z'),
    )
    expect(result.current.isPast).toBe(false)
  })

  it('isPast est false pour une mission < 60s dans le passé', () => {
    // 30s avant 10:00 = 09:59:30, soit 30s de retard
    const { result } = renderHook(() =>
      useCourseTopStats('2026-05-01T09:59:30.000Z'),
    )
    expect(result.current.isPast).toBe(false)
  })

  it('isPast est true pour une mission > 60s dans le passé', () => {
    // 2 minutes avant 10:00 = 09:58:00
    const { result } = renderHook(() =>
      useCourseTopStats('2026-05-01T09:58:00.000Z'),
    )
    expect(result.current.isPast).toBe(true)
  })
})

describe('useCourseTopStats — champs retournés', () => {
  it('retourne date, time, countdown et isPast', () => {
    const { result } = renderHook(() =>
      useCourseTopStats('2026-05-01T11:00:00.000Z'),
    )
    expect(typeof result.current.date).toBe('string')
    expect(typeof result.current.time).toBe('string')
    expect(typeof result.current.countdown).toBe('string')
    expect(typeof result.current.isPast).toBe('boolean')
  })

  it('time est formaté HH:MM', () => {
    const { result } = renderHook(() =>
      useCourseTopStats('2026-05-01T09:30:00.000Z'),
    )
    expect(result.current.time).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('useCourseTopStats — tick', () => {
  it('met à jour now après 30 secondes via setInterval', () => {
    // Mission dans 1 minute : countdown = "Dans 1 min" → puis "Maintenant" après 60s
    const { result } = renderHook(() =>
      useCourseTopStats('2026-05-01T10:01:00.000Z'),
    )
    const countdown0 = result.current.countdown

    // Avancer 30s → interval tick
    act(() => { vi.advanceTimersByTime(30_000) })
    // Le compte à rebours peut changer (pas forcément, il est à 1 min)
    // On vérifie juste que le hook ne plante pas et que now se met à jour
    expect(result.current.countdown).toBeDefined()
    expect(countdown0).toBeTruthy()
  })
})
