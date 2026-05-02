'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CoursesEmptyOnboarding } from '../CoursesEmptyOnboarding'
import { useMissionEditSheetStore } from '@/store/missionEditSheetStore'
import type { Mission } from '@/lib/supabase/types'
import { NextCourseHero } from './NextCourseHero'
import { TodayRideRow } from './TodayRideRow'
import { useTodayTab } from './useTodayTab'

export function TodayTab() {
  const t = useTodayTab()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const openEdit = useMissionEditSheetStore((s) => s.open)

  const openCreer = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('creer', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleEdit = (m: Mission) => openEdit(m)

  if (t.loading) {
    return (
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-32 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
        ))}
      </ul>
    )
  }
  if (t.error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        {t.error}
      </div>
    )
  }

  if (!t.current && !t.next && t.restOfDay.length === 0) {
    return <CoursesEmptyOnboarding onPostCourse={openCreer} />
  }

  // Si une course est en cours, on l'affiche en hero et on rebascule la
  // "prochaine" dans la liste "Reste de la journée" (sinon elle disparait).
  const heroMission = t.current ?? t.next
  const restList = t.current && t.next ? [t.next, ...t.restOfDay] : t.restOfDay
  const restTotal = restList.reduce((s, m) => s + Number(m.price_eur ?? 0), 0)

  const hasGrid = heroMission && restList.length > 0

  return (
    <div className={hasGrid ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6 lg:items-start' : ''}>
      {heroMission && (
        <div className={`${hasGrid ? 'lg:sticky lg:top-6' : 'lg:max-w-2xl lg:mx-auto'}`}>
          <NextCourseHero mission={heroMission} onEdit={handleEdit} />
        </div>
      )}

      {restList.length > 0 && (
        <section className={!heroMission ? 'lg:max-w-3xl lg:mx-auto' : ''}>
          <header className="flex items-end justify-between mb-1 px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-warm-500">
              Reste de la journée
            </h3>
            <span className="text-[11px] text-warm-500 font-semibold tabular-nums">
              {restList.length} · {restTotal}€
            </span>
          </header>
          <ul>
            {restList.map((m) => (
              <li key={m.id}>
                <TodayRideRow mission={m} onTap={t.openDetails} onEdit={handleEdit} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
