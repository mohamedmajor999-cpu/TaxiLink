'use client'
import { Home, List, Plus, Users, User, Eye } from 'lucide-react'
import { OnlineDot } from './OnlineDot'
import type { DriverTab, NavBadge } from './navTypes'

interface Props {
  activeTab: DriverTab
  onTabChange: (tab: DriverTab) => void
  onPostCourse: () => void
  onShowCurrentCourse: () => void
  driverName: string
  driverInitials: string
  groupName: string
  isOnline: boolean
  badges?: NavBadge
}

const ITEMS: { key: DriverTab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'courses', label: 'Mes courses', icon: List },
  { key: 'groupes', label: 'Groupes', icon: Users },
  { key: 'profil', label: 'Mon profil', icon: User },
]

export function SidebarNav({
  activeTab,
  onTabChange,
  onPostCourse,
  onShowCurrentCourse,
  driverName,
  driverInitials,
  groupName,
  isOnline,
  badges,
}: Props) {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-paper border-r border-warm-200 h-screen sticky top-0">
      <div className="px-5 py-6 flex items-center gap-2">
        <div className="w-7 h-7 bg-ink rounded-lg flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-brand rounded-sm" />
        </div>
        <span className="font-semibold text-ink text-sm">TaxiLink</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {ITEMS.slice(0, 2).map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={activeTab === item.key}
            badge={item.key === 'courses' ? badges?.courses : undefined}
            onClick={() => onTabChange(item.key)}
          />
        ))}

        <button
          type="button"
          onClick={onPostCourse}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-warm-50 transition-colors"
        >
          <Plus className="w-[18px] h-[18px]" strokeWidth={1.8} />
          Poster une course
        </button>

        <button
          type="button"
          onClick={onShowCurrentCourse}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-warm-500 hover:bg-warm-50 hover:text-ink transition-colors"
        >
          <Eye className="w-[16px] h-[16px]" strokeWidth={1.6} />
          <span className="flex-1 text-left">Course en cours</span>
          <span className="text-[10px] uppercase tracking-wider text-warm-400">aperçu</span>
        </button>

        {ITEMS.slice(2).map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={activeTab === item.key}
            badge={item.key === 'groupes' ? badges?.groupes : undefined}
            onClick={() => onTabChange(item.key)}
          />
        ))}
      </nav>

      <div className="m-3 p-3 rounded-xl border border-warm-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center text-sm font-semibold">
          {driverInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{driverName}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-warm-500">
            <OnlineDot online={isOnline} size="sm" />
            {groupName} · {isOnline ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>
      </div>
    </aside>
  )
}

function NavItem({
  item,
  active,
  badge,
  onClick,
}: {
  item: { key: DriverTab; label: string; icon: typeof Home }
  active: boolean
  badge?: number
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-warm-50 text-ink' : 'text-warm-600 hover:bg-warm-50 hover:text-ink'}`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-brand" />
      )}
      <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.6} />
      <span className="flex-1 text-left">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-semibold text-paper bg-ink rounded-full px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </button>
  )
}
