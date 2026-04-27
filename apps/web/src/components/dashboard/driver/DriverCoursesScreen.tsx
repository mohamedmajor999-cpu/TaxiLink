'use client'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useDriverCoursesScreen, type CoursesTab } from './courses/useDriverCoursesScreen'
import { UpcomingTab } from './courses/UpcomingTab'
import { PostedTab } from './courses/PostedTab'
import { HistoryTab } from './courses/HistoryTab'
import { CoursesEarningsHero } from './courses/CoursesEarningsHero'

interface Props {
  onPostCourse: () => void
}

export function DriverCoursesScreen({ onPostCourse }: Props) {
  const { active, setActive, subTabs, dateLabel } = useDriverCoursesScreen()

  return (
    <div className="relative px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-5xl mx-auto pb-24 md:pb-6">
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

      <CoursesEarningsHero />

      <nav className="grid grid-cols-3 gap-2 mb-5 md:max-w-2xl">
        {subTabs.map((t) => <TabPill key={t.id} tab={t} active={active} onClick={setActive} />)}
      </nav>

      <div className="transition-opacity">
        {active === 'upcoming' && <UpcomingTab />}
        {active === 'posted' && <PostedTab />}
        {active === 'history' && <HistoryTab />}
      </div>

      <button
        type="button"
        onClick={onPostCourse}
        aria-label="Nouvelle course"
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-ink text-brand shadow-fab hover:shadow-fab-hover flex items-center justify-center active:scale-95 transition-all z-30"
      >
        <Plus className="w-6 h-6" strokeWidth={2.6} />
      </button>
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
      className={`relative inline-flex items-center justify-center gap-2 h-11 px-3 rounded-full text-[13px] font-semibold transition-colors ${
        isActive
          ? 'bg-ink text-paper'
          : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
      <span>{tab.label}</span>
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
