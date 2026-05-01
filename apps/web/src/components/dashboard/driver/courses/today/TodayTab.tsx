'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CurrentCourseStrip } from '../CurrentCourseStrip'
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

  return (
    <div>
      {t.current && <CurrentCourseStrip mission={t.current} />}
      {t.next && <NextCourseHero mission={t.next} onEdit={handleEdit} />}

      {t.restOfDay.length > 0 && (
        <section>
          <header className="flex items-end justify-between mb-1 px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-warm-500">
              Reste de la journée
            </h3>
            <span className="text-[11px] text-warm-500 font-semibold tabular-nums">
              {t.restOfDay.length} · {t.restOfDay.reduce((s, m) => s + Number(m.price_eur ?? 0), 0)}€
            </span>
          </header>
          <ul>
            {t.restOfDay.map((m) => (
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
