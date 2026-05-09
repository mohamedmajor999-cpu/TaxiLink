'use client'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useDriverCoursesScreen, type CoursesTab } from './courses/useDriverCoursesScreen'
import { useDriverAgendaSync } from './courses/useDriverAgendaSync'
import { TodayTab } from './courses/today/TodayTab'
import { AgendaTab } from './courses/AgendaTab'
import { AdsTab } from './courses/ads/AdsTab'
import { StatsTab } from './courses/StatsTab'
import { CoursesEarningsChip } from './courses/CoursesEarningsChip'
import type { EarningsChipVariant } from './courses/useCoursesEarningsChip'

interface Props {
  onPostCourse: () => void
}

const CHIP_VARIANT_BY_TAB: Record<CoursesTab, EarningsChipVariant> = {
  today: 'today',
  agenda: 'week',
  ads: 'pendingAds',
  stats: 'week',
}

export function DriverCoursesScreen({ onPostCourse }: Props) {
  useDriverAgendaSync()
  const { active, setActive, subTabs, dateLabel } = useDriverCoursesScreen()

  return (
    <div className="relative px-4 md:px-8 pt-[calc(66px+env(safe-area-inset-top))] pb-24 md:pt-6 md:pb-6 max-w-2xl md:max-w-5xl xl:max-w-7xl mx-auto">
      <header className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/brand/icon.svg" alt="TaxiLink" width={40} height={40} className="w-9 h-9 md:w-10 md:h-10 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[18px] md:text-[22px] font-bold text-ink leading-tight tracking-tight">
              Mes courses
            </h1>
            <p className="text-[12px] md:text-[13px] text-warm-500 mt-0.5 truncate capitalize">
              {dateLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CoursesEarningsChip variant={CHIP_VARIANT_BY_TAB[active]} />
          <button
            type="button"
            onClick={onPostCourse}
            className="hidden md:inline-flex items-center gap-1 h-9 px-4 rounded-lg bg-ink text-paper text-sm font-semibold hover:bg-warm-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
            Nouvelle course
          </button>
        </div>
      </header>

      <nav className="grid grid-cols-4 gap-1.5 mb-5 md:max-w-2xl">
        {subTabs.map((t) => <TabPill key={t.id} tab={t} active={active} onClick={setActive} />)}
      </nav>

      <div className="transition-opacity">
        {active === 'today' && <TodayTab />}
        {active === 'agenda' && <AgendaTab />}
        {active === 'ads' && <AdsTab onPostCourse={onPostCourse} />}
        {active === 'stats' && <StatsTab />}
      </div>
    </div>
  )
}

function TabPill({
  tab, active, onClick,
}: {
  tab: { id: CoursesTab; label: string; icon?: string; badge?: number }
  active: CoursesTab
  onClick: (id: CoursesTab) => void
}) {
  const isActive = active === tab.id
  const hasBadge = tab.badge !== undefined && tab.badge > 0
  return (
    <button
      type="button"
      onClick={() => onClick(tab.id)}
      className={`relative inline-flex items-center justify-center gap-1 h-11 px-2 rounded-full text-[12.5px] font-semibold transition-colors min-w-0 ${
        isActive
          ? 'bg-ink text-paper'
          : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
      <span className="truncate">{tab.label}</span>
      {hasBadge && (
        <span
          aria-label={`${tab.badge} nouvelle${tab.badge! > 1 ? 's' : ''} notification${tab.badge! > 1 ? 's' : ''}`}
          className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-brand text-ink text-[11px] font-bold inline-flex items-center justify-center"
        >
          {tab.badge! > 99 ? '99+' : tab.badge}
        </span>
      )}
    </button>
  )
}
