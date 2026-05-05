'use client'
import { Icon } from '@/components/ui/Icon'
import type { PatronTab } from '@/components/dashboard/patron/PatronDashboard'

const TABS: { id: PatronTab; label: string; icon: string }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: 'dashboard'      },
  { id: 'agenda',   label: 'Planning',       icon: 'calendar_month' },
  { id: 'drivers',  label: 'Chauffeurs',     icon: 'group'          },
  { id: 'finances', label: 'Finances',       icon: 'euro'           },
]

interface NavProps {
  activeTab: PatronTab
  onTabChange: (tab: PatronTab) => void
  onOpenSettings?: () => void
  onPostCourse?: () => void
}

export function PatronSidebar({ activeTab, onTabChange, onOpenSettings, onPostCourse }: NavProps) {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface">
      <div className="px-6 py-6 border-b border-warm-200 dark:border-night-border">
        <span className="text-lg font-extrabold text-ink dark:text-night-text">TaxiLink</span>
        <span className="block text-xs text-warm-600 dark:text-night-text-soft mt-0.5">Patron</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {TABS.map((t, i) => {
          const active = t.id === activeTab
          return (
            <div key={t.id}>
              <button
                type="button"
                onClick={() => onTabChange(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-ink dark:bg-night-brand text-paper dark:text-night-bg'
                    : 'text-warm-700 dark:text-night-text-soft hover:bg-warm-100 dark:hover:bg-night-elevated'
                }`}
              >
                <Icon name={t.icon} size={20} />
                <span>{t.label}</span>
              </button>
              {i === 1 && onPostCourse && (
                <button
                  type="button"
                  onClick={onPostCourse}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-brand text-ink hover:opacity-90 transition-opacity my-1"
                >
                  <Icon name="add_road" size={20} />
                  <span>Poster une course</span>
                </button>
              )}
            </div>
          )
        })}
      </nav>
      {onOpenSettings && (
        <div className="px-3 py-3 border-t border-warm-200 dark:border-night-border">
          <button type="button" onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-warm-700 dark:text-night-text-soft hover:bg-warm-100 dark:hover:bg-night-elevated">
            <Icon name="settings" size={20} />
            <span>Paramètres</span>
          </button>
        </div>
      )}
    </aside>
  )
}

export function PatronBottomNav({ activeTab, onTabChange }: NavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper dark:bg-night-surface border-t border-warm-200 dark:border-night-border">
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.id === activeTab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active ? 'text-ink dark:text-night-brand' : 'text-warm-600 dark:text-night-text-soft'
              }`}
            >
              <Icon name={t.icon} size={20} />
              <span className="truncate max-w-full px-1">{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
