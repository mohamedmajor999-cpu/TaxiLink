'use client'
import { Home, List, Plus, Users, User } from 'lucide-react'
import type { DriverTab } from './navTypes'

interface Props {
  activeTab: DriverTab
  onTabChange: (tab: DriverTab) => void
  onPostCourse: () => void
}

const LEFT: { key: DriverTab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'courses', label: 'Courses', icon: List },
]

const RIGHT: { key: DriverTab; label: string; icon: typeof Home }[] = [
  { key: 'groupes', label: 'Groupes', icon: Users },
  { key: 'profil', label: 'Profil', icon: User },
]

export function MobileBottomNav({ activeTab, onTabChange, onPostCourse }: Props) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-warm-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-5 items-end h-16 relative">
        {LEFT.map((item) => (
          <NavBtn key={item.key} item={item} active={activeTab === item.key} onClick={() => onTabChange(item.key)} />
        ))}

        <div className="flex items-start justify-center -mt-5">
          <button
            type="button"
            onClick={onPostCourse}
            aria-label="Poster une course"
            className="w-14 h-14 rounded-full bg-brand text-ink flex items-center justify-center shadow-fab hover:shadow-fab-hover transition-shadow"
          >
            <Plus className="w-6 h-6" strokeWidth={2.2} />
          </button>
        </div>

        {RIGHT.map((item) => (
          <NavBtn key={item.key} item={item} active={activeTab === item.key} onClick={() => onTabChange(item.key)} />
        ))}
      </div>
    </nav>
  )
}

function NavBtn({
  item,
  active,
  onClick,
}: {
  item: { key: DriverTab; label: string; icon: typeof Home }
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`h-16 flex flex-col items-center justify-center gap-1 ${active ? 'text-ink' : 'text-warm-500'}`}
    >
      <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.6} />
      <span className="text-[10px] font-medium">{item.label}</span>
    </button>
  )
}
