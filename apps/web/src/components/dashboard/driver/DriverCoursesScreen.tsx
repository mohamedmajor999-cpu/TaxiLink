'use client'
import { Download, Plus } from 'lucide-react'
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
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-6xl mx-auto pb-24 md:pb-6">
      <header className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="font-serif text-display-md text-ink leading-tight">Mes courses</h1>
          <p className="text-sm text-warm-600 mt-1 capitalize">{dateLabel}</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-warm-600 hover:bg-warm-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
            Exporter
          </button>
          <button
            type="button"
            onClick={onPostCourse}
            className="inline-flex items-center gap-1 h-9 px-4 rounded-lg bg-ink text-paper text-sm font-semibold hover:bg-warm-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
            Nouvelle course
          </button>
        </div>
      </header>

      <nav className="flex items-center gap-6 border-b border-warm-200 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        {subTabs.map((t) => <TabButton key={t.id} tab={t} active={active} onClick={setActive} />)}
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

function TabButton({
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
      className={`shrink-0 inline-flex items-center gap-1.5 px-1 py-3 -mb-px border-b-2 text-sm font-semibold transition-colors ${isActive ? 'border-ink text-ink' : 'border-transparent text-warm-500 hover:text-ink'}`}
    >
      {tab.icon && <span>{tab.icon}</span>}
      {tab.label}
    </button>
  )
}
