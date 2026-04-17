'use client'
import { Calendar, Download, Plus } from 'lucide-react'
import { useDriverCoursesScreen, type CoursesTab } from './courses/useDriverCoursesScreen'
import { UpcomingTab } from './courses/UpcomingTab'
import { AgendaTab } from './courses/AgendaTab'
import { PostedTab } from './courses/PostedTab'
import { HistoryTab } from './courses/HistoryTab'

interface Props {
  onPostCourse: () => void
}

export function DriverCoursesScreen({ onPostCourse }: Props) {
  const { active, setActive, subTabs, dateLabel } = useDriverCoursesScreen()

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-5xl mx-auto pb-24 md:pb-6">
      <header className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-ink rounded-lg flex items-center justify-center shrink-0">
            <div className="w-3 h-3 md:w-3.5 md:h-3.5 bg-brand rounded-sm" />
          </div>
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
            aria-label="Agenda"
            className="w-9 h-9 md:hidden rounded-lg border border-warm-200 bg-paper flex items-center justify-center text-ink hover:bg-warm-50 transition-colors"
          >
            <Calendar className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-warm-600 hover:bg-warm-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
            Exporter
          </button>
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

      <nav className="grid grid-cols-4 gap-2 mb-5 md:max-w-2xl">
        {subTabs.map((t) => <TabPill key={t.id} tab={t} active={active} onClick={setActive} />)}
      </nav>

      <div className="transition-opacity">
        {active === 'upcoming' && <UpcomingTab />}
        {active === 'agenda' && <AgendaTab />}
        {active === 'posted' && <PostedTab />}
        {active === 'history' && <HistoryTab />}
      </div>
    </div>
  )
}

function TabPill({
  tab, active, onClick,
}: {
  tab: { id: CoursesTab; label: string; icon?: string }
  active: CoursesTab
  onClick: (id: CoursesTab) => void
}) {
  const isActive = active === tab.id
  return (
    <button
      type="button"
      onClick={() => onClick(tab.id)}
      className={`inline-flex items-center justify-center h-11 px-3 rounded-full text-[13px] font-semibold transition-colors ${
        isActive
          ? 'bg-ink text-paper'
          : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
      {tab.label}
    </button>
  )
}
